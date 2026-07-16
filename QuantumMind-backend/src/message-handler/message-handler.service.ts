import { HttpService } from "@nestjs/axios";

import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";

import {
  isCreditCard,
  isCurrency,
  isDate,
  isEmail,
  isIP,
  isMACAddress,
  isMobilePhone,
  isString,
  IsUrl,
} from "class-validator";
import { firstValueFrom } from "rxjs";
import { AgentService } from "src/agent/agent.service";
import { BotsService } from "src/bots/bots.service";
import { BotFlowNode } from "src/bots/entities";
import { NodeTypeEnum } from "src/bots/enums/node-type.enum";
import { ConversationService } from "src/conversation/conversation.service";
import { ChatTypeEnum } from "src/conversation/enums/chat-type.enum";
import { QuestionsService } from "src/questions/questions.service";
import { RedisPropagatorService } from "src/redis-propagate/redis-propagate.service";
import { SegmentsService } from "src/segments/segments.service";
import {
  SocketState,
  SocketStateService,
} from "src/socket/socket-state.service";
import { AuthenticatedSocket } from "src/socket/socket.adaptor";
import { TicketsService } from "src/tickets/tickets.service";
import { UnansweredService } from "src/unanswered/unanswered.service";
import { generateId } from "src/util";
import { WebhookStatusEnum } from "src/webhook/enums/webhook-status.enum";
import { WebhookService } from "src/webhook/webhook.service";
import { ModeEnum } from "src/widget/enums/mode.enum";
import { Markup } from "telegraf";
import { MESSAGE_HANDLER_QUEUE } from "./constants";
import { MessageResponseDto } from "./dto/message-response.dto";
import { BotNodeStateEnum } from "./enums/bot-node-state.enum";
import { UserInputValidationEnum } from "./enums/user-input-validation.enums";

@Injectable()
export class MessageHandlerService {
  private readonly logger = new Logger(MessageHandlerService.name);
  private user: AuthenticatedSocket;
  private language: string;

  private ctx: any;
  private chatId: string;
  private delay: Record<string, number> = {};
  constructor(
    private readonly botsService: BotsService,
    private readonly socketStateService: SocketStateService,
    private readonly segmentsService: SegmentsService,
    private readonly webhookService: WebhookService,
    private readonly ticketsService: TicketsService,
    private readonly conversationService: ConversationService,
    private readonly redisPropagatorService: RedisPropagatorService,
    private readonly agentService: AgentService,
    private readonly unansweredService: UnansweredService,
    private readonly questionsService: QuestionsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}

  async setNextNode(nodeId: string, userId: string | any) {
    const node = await this.botsService.getBotNode(nodeId);
    this.socketStateService.updateUserData(userId, {
      currentNode: node,
    });
  }

  async handleBlockedContent() {
    const userId = this.user.auth.userId;
    return await this.sendBotMessage(userId, [
      {
        type: "text",
        value: "Sorry, you are not allowed to send this message",
      },
    ]);
  }

  async handleMessage(
    message: any,
    user: AuthenticatedSocket,
    type = "text",
    language = "english",
    ctx?: any
  ): Promise<any> {
    this.user = user;
    this.language = language;
    const userId = this.user.auth.userId;
    this.ctx = ctx;
    const userData = this.socketStateService.getUserData(userId);
    if (!userData) return;
    const { mode, conversationId, currentNode } = userData;
    if (!currentNode) return;

    if (mode !== ModeEnum.preview && conversationId && message) {
      const chatId = generateId("chat", 10);
      this.chatId = chatId;
      this.eventEmitter.emit("create.new.chat", {
        sender: userId,
        message: message,
        type: type,
        conversationId,
        chatId,
      });
    }

    const blockedContent =
      this.socketStateService.getUserData(userId)?.botSettings
        ?.blockedContent || [];
    const isBlocked = blockedContent.some((content: string) => {
      if (message && message.toLowerCase().includes(content.toLowerCase())) {
        return this.handleBlockedContent();
      }
    });

    if (isBlocked) {
      return;
    }

    if (type === "goto") {
      const step = await this.botsService.getBotNode(message);
      this.socketStateService.updateUserData(userId, {
        currentNode: step,
      });

      return this.handleNode(step, message, userId);
    }
    message = message.trim().toLowerCase();
    if (message === "start" || message === "reset" || message === "restart") {
      const { startNode, botSettings, role } =
        this.socketStateService.getUserData(userId);

      await this.sendBotMessage(userId, [
        {
          type: "text",
          value:
            botSettings?.welcomeMessages ||
            "Welcome to the bot, how can I help you?",
        },
      ]);

      if (startNode) {
        this.socketStateService.updateUserData(userId, {
          currentNode: startNode,
          BotNodeState: {},
          questionNodeState: {},
          attributes: {},
        });
        return this.handleNode(startNode, message, userId);
      }
    }

    const list: string[] = [NodeTypeEnum.QUESTIONS, NodeTypeEnum.USER_INPUT];
    if (list.includes(currentNode.nodeType)) {
      this.delay[conversationId] = parseInt(
        this.configService.get("delay.node")
      );
    }

    await this.handleNode(currentNode, message, userId, language);
  }

  async handleNode(
    currentNode: BotFlowNode,
    message: any,
    userId: string | any,
    language = "english"
  ): Promise<any> {
    try {
      const userdata = this.socketStateService.getUserData(userId);
      if (!userdata) return;
      const { conversationId, defaultFallback } = userdata;
      if (!currentNode) {
        return this.defaultFallback(message, defaultFallback, userId);
      }
      if (
        currentNode.id !==
        this.socketStateService.getUserData(userId).currentNode.id
      ) {
        this.socketStateService.updateUserData(userId, {
          currentNode,
        });
      }
      this.logger.verbose(
        `current Node: ${currentNode.nodeType} ${currentNode.id}`
      );

      switch (currentNode.nodeType) {
        case NodeTypeEnum.START_NODE:
          return await this.handleStartNode(
            currentNode,
            message,
            userId,
            language
          );

        case NodeTypeEnum.BOT_RESPONSE:
          return await this.handleBotResponse(message, currentNode, userId);

        case NodeTypeEnum.USER_INPUT:
          return await this.handleUserInput(message, currentNode, userId);

        case NodeTypeEnum.FALL_BACK:
          return await this.defaultFallback(message, currentNode, userId);

        case NodeTypeEnum.ADD_TO_SEGMENT:
          return await this.handleAddToSegment(message, currentNode, userId);

        case NodeTypeEnum.REMOVE_FROM_SEGMENT:
          return await this.handleRemoveFromSegment(
            message,
            currentNode,
            userId
          );

        case NodeTypeEnum.WEBHOOK:
          return await this.handleWebHookCall(message, currentNode, userId);

        case NodeTypeEnum.TICKET:
          return await this.handleCreateTicket(message, currentNode, userId);

        case NodeTypeEnum.GO_TO_STEP:
          return await this.handleGoToStep(message, currentNode, userId);

        case NodeTypeEnum.SUCCESS:
          return await this.handleSuccessNode(message, currentNode, userId);

        case NodeTypeEnum.FAILURE:
          return await this.handleFailureNode(message, currentNode, userId);

        case NodeTypeEnum.TRANSFER_TO_AGENT:
          return await this.TransferToAgent(message, currentNode, userId);

        case NodeTypeEnum.QUESTIONS:
          return await this.handleQuestion(message, currentNode, userId);

        case NodeTypeEnum.FILE_ATTACHMENT:
          return await this.handleAttachmentInput(message, currentNode, userId);

        case NodeTypeEnum.SET_ATTRIBUTES:
          return await this.handleSetAttributes(message, currentNode, userId);

        case NodeTypeEnum.CLOSE_CHAT:
          return await this.handleCloseChat(message, currentNode, userId);

        default:
          return await this.defaultFallback(message, currentNode, userId);
      }
    } catch (error) {
      this.logger.error(`Error in Handling Node : ${error.message}`);

      return await this.sendBotMessage(userId, [
        {
          type: "text",
          value:
            this.socketStateService.getUserData(userId)?.botSettings
              ?.fallbackMessage ||
            "I am sorry, I am not able to understand you",
        },
      ]);
    }
  }

  async handleStartNode(
    currentNode: BotFlowNode,
    message: any,
    userId: string | any,
    language: string
  ) {
    const NextNodes: BotFlowNode[] = await Promise.all(
      currentNode.next.map(async (nodeId: string) => {
        return await this.botsService.getBotNode(nodeId);
      })
    );

    const defaultFallback = NextNodes.find(
      (node: BotFlowNode) => node.nodeType === NodeTypeEnum.FALL_BACK
    );
    this.socketStateService.updateUserData(userId, { defaultFallback });

    const otherNode = NextNodes.find(
      (node: BotFlowNode) => node.nodeType !== NodeTypeEnum.FALL_BACK
    );

    const startMessagesList = [
      "start",
      "reset",
      "restart",
      "hi",
      "hello",
      "hey",
      "help",
    ];

    if (
      !startMessagesList.includes(message) &&
      message?.split(" ").length > 1
    ) {
      const response = await this.findAnswerFromQuestionBank(message, language);

      if (response) {
        return await this.sendBotMessage(userId, [
          {
            type: "text",
            value: response,
          },
        ]);
      }
    }

    return this.handleNode(otherNode, message, userId);
  }

  async handleBotResponse(
    message: any,
    node: BotFlowNode,
    userId: string | any
  ) {
    if (node.next.length === 1) {
      await this.sendBotMessage(userId, node.responses);
      const nextNode = await this.botsService.getBotNode(node.next[0]);

      this.socketStateService.updateUserData(userId, {
        currentNode: nextNode,
      });

      if (
        nextNode.nodeType === NodeTypeEnum.USER_INPUT ||
        nextNode.nodeType === NodeTypeEnum.FILE_ATTACHMENT
      ) {
        return;
      }
      return this.handleNode(nextNode, message, userId);
    }
    if (node.next.length > 1) {
      const nodeState = this.socketStateService.getNodeState(userId, node.id);

      if (nodeState === BotNodeStateEnum.NEW) {
        this.socketStateService.setNodeState(
          userId,
          node.id,
          BotNodeStateEnum.AWAITING_USER_INPUT
        );
        return await this.sendBotMessage(userId, node.responses);
      }
      if (nodeState === BotNodeStateEnum.AWAITING_USER_INPUT) {
        const nextNodes = await Promise.all(
          node.next.map(async (nodeId: string) => {
            return await this.botsService.getBotNode(nodeId);
          })
        );

        this.socketStateService.setNodeState(
          userId,
          node.id,
          BotNodeStateEnum.NEW
        );

        const matchedNode = nextNodes
          .map((ele: BotFlowNode) => {
            if (ele.nodeType === NodeTypeEnum.USER_INPUT) {
              return this.checkIfUserInputMatching(message, ele, userId)
                ? ele
                : null;
            }
            return null;
          })
          .find((ele: any) => ele);

        if (matchedNode) {
          this.socketStateService.setNodeState(
            userId,
            matchedNode.id,
            BotNodeStateEnum.VISITED
          );
          return this.handleNode(matchedNode, message, userId);
        }
        this.socketStateService.setNodeState(
          userId,
          node.id,
          BotNodeStateEnum.AWAITING_USER_INPUT
        );

        const response = await this.findAnswerFromQuestionBank(message);
        if (response) {
          return await this.sendBotMessage(userId, [
            {
              type: "text",
              value: response,
            },
          ]);
        }
        const { fallbackMessage } =
          this.socketStateService.getUserData(userId)?.botSettings;
        return await this.sendBotMessage(userId, [
          {
            type: "text",
            value:
              fallbackMessage || "I am sorry, I am not able to understand you",
          },
        ]);
      }
    }

    await this.sendBotMessage(userId, node.responses);
    return this.socketStateService.updateUserData(userId, {
      currentNode: null,
    });
  }
  async handleUserInput(message: any, node: BotFlowNode, userId: string | any) {
    const nextNodes = await this.botsService.getBotNode(node.next[0]);
    const nodeState = this.socketStateService.getNodeState(userId, node.id);
    // console.log('userinput nodeState', nodeState);
    if (nodeState === BotNodeStateEnum.VISITED) {
      return this.handleNode(nextNodes, message, userId);
    } else if (this.checkIfUserInputMatching(message, node, userId)) {
      // console.log('mattched node and goig to next node');
      return this.handleNode(nextNodes, message, userId);
    } else {
      return this.handleNode(
        this.socketStateService.getUserData(userId).defaultFallback,
        message,
        userId
      );
    }
  }

  checkIfUserInputMatching(
    message: string,
    node: BotFlowNode,
    userId: string | any
  ): boolean {
    const { alias, entity, secure } = node.payload;
    if (secure) {
      this.eventEmitter.emit("mask.chat", this.chatId);
    }
    if (entity && entity !== UserInputValidationEnum.ANY) {
      if (!this.validationCheck(entity, message)) {
        return false;
      }
      if (alias) {
        this.socketStateService.updateUserData(userId, {
          attributes: {
            ...this.socketStateService.getUserData(userId).attributes,
            [alias]: message,
          },
        });
      }
      return true;
    }

    if (node.keywords.length > 0) {
      const keywordMatched = node.keywords.some((keyword: string) => {
        return message.includes(keyword.toLowerCase());
      });

      if (keywordMatched) {
        if (alias) {
          this.socketStateService.updateUserData(userId, {
            attributes: {
              ...this.socketStateService.getUserData(userId).attributes,
              [alias]: message,
            },
          });
        }
        return true;
      }
    }

    if (node.utterance.length > 0) {
      const utteranceMatched = node.utterance.some((utterance: string) => {
        return utterance.toLowerCase().includes(message.toLowerCase());
      });

      if (utteranceMatched) {
        if (alias) {
          this.socketStateService.updateUserData(userId, {
            attributes: {
              ...this.socketStateService.getUserData(userId).attributes,
              [alias]: message,
            },
          });
        }
        return true;
      }
    }

    if (alias) {
      this.socketStateService.updateUserData(userId, {
        attributes: {
          ...this.socketStateService.getUserData(userId).attributes,
          [alias]: message,
        },
      });
      return true;
    }
    return false;
  }

  async defaultFallback(message: any, node: BotFlowNode, userId: string | any) {
    const response = await this.findAnswerFromQuestionBank(message);

    if (response) {
      return await this.sendBotMessage(userId, [
        {
          type: "text",
          value: response,
        },
      ]);
    }
    this.saveUnansweredMessage(message, userId);
    if (node?.next.length > 0) {
      const nextNode = await this.botsService.getBotNode(node.next[0]);
      this.socketStateService.updateUserData(userId, {
        currentNode: nextNode,
      });
      return this.handleNode(nextNode, message, userId);
    }
    return await this.sendBotMessage(userId, [
      {
        type: "text",
        value:
          this.socketStateService.getUserData(userId).botSettings
            ?.fallbackMessage || "I am sorry, I am not able to understand you",
      },
    ]);
  }
  async handleAddToSegment(
    message: any,
    node: BotFlowNode,
    userId: string | any
  ) {
    const segmentId = node.payload.segmentId;
    await this.segmentsService.addVisitor(segmentId, userId);
    const nextNode = await this.botsService.getBotNode(node.next[0]);
    return this.handleNode(nextNode, message, userId);
  }

  async handleRemoveFromSegment(
    message: any,
    node: BotFlowNode,
    userId: string | any
  ) {
    const segmentId = node.payload.segmentId;
    await this.segmentsService.removeVisitor(segmentId, userId);
    const nextNode = await this.botsService.getBotNode(node.next[0]);
    return this.handleNode(nextNode, message, userId);
  }

  async handleWebHookCall(
    message: any,
    node: BotFlowNode,
    userId: string | any
  ) {
    const nextNodes = await Promise.all(
      node.next.map(async (nodeId: string) => {
        return await this.botsService.getBotNode(nodeId);
      })
    );
    const successNode = nextNodes.find((ele: BotFlowNode) => {
      return ele.nodeType === NodeTypeEnum.SUCCESS;
    });
    const failureNode = nextNodes.find((ele: BotFlowNode) => {
      return ele.nodeType === NodeTypeEnum.FAILURE;
    });
    const webhookId = node.payload.webhookId;
    if (!webhookId) {
      return this.handleNode(failureNode, message, userId);
    }

    const { attributes, metadata } =
      this.socketStateService.getUserData(userId);
    const data = {
      attributes: attributes,
      event: node.payload.eventField,
      metadata: metadata,
      // visitor: this.user,
    };
    const response = await this.webhookService.callWebhook(
      webhookId,
      data,
      this.socketStateService.getUserData(userId).botId
    );
    if (response.status === WebhookStatusEnum.SUCCESS) {
      if (Array.isArray(response.data)) {
        await this.sendBotMessage(userId, response.data);
      }
      if (response.metadata) {
        this.socketStateService.updateUserData(userId, {
          metadata: {
            ...this.socketStateService.getUserData(userId).metadata,
            ...response.metadata,
          },
        });
      }

      return this.handleNode(successNode, message, userId);
    } else return this.handleNode(failureNode, message, userId);
  }

  async handleGoToStep(message: any, node: BotFlowNode, userId: string | any) {
    const stepId = node.payload.blockId;

    const step = await this.botsService.getBotNode(stepId);
    this.socketStateService.updateUserData(userId, {
      BotNodeState: {},
      questionNodeState: {},
    });
    return this.handleNode(step, message, userId);
  }

  async handleCreateTicket(
    message: any,
    node: BotFlowNode,
    userId: string | any
  ) {
    try {
      const subject = node.payload.ticketSubject;
      const userData = this.socketStateService.getUserData(userId);

      const ticket = await this.ticketsService.create({
        subject,
        visitor: userId,
        bot: userData.botId,

        conversationId: userData.conversationId,
      });
      const nextNode = await this.botsService.getBotNode(node.next[0]);
      await this.sendBotMessage(userId, [
        {
          type: "text",
          value: `Service Request Raised Successfully. Please note down the ticket  : #${ticket.id} for future reference.`,
        },
      ]);

      return this.handleNode(nextNode, message, userId);
    } catch (e) {
      this.logger.error(e);
    }
  }

  validationCheck(validation: string, message: any) {
    switch (validation) {
      case UserInputValidationEnum.EMAIL:
        return isEmail(message);
      case UserInputValidationEnum.NUMBER:
        return !isNaN(message);
      case UserInputValidationEnum.TEXT:
        return isString(message);
      case UserInputValidationEnum.ANY:
        return true;
      case UserInputValidationEnum.DATE:
        return !isNaN(Date.parse(message));
      case UserInputValidationEnum.ALPHANUMERIC:
        return /^[a-zA-Z0-9]*$/.test(message);
      case UserInputValidationEnum.YES_NO:
        return ["yes", "no"].includes(message);
      case UserInputValidationEnum.YES:
        return ["yes"].includes(message);
      case UserInputValidationEnum.NO:
        return ["no"].includes(message);
      case UserInputValidationEnum.PHONE:
        return !isNaN(message);
      default:
        return true;
    }
  }

  async handleFailureNode(
    message: any,
    node: BotFlowNode,
    userId: string | any
  ) {
    if (node.next.length > 0) {
      const nextNode = await this.botsService.getBotNode(node.next[0]);
      return this.handleNode(nextNode, message, userId);
    }
  }

  async handleSuccessNode(
    message: any,
    node: BotFlowNode,
    userId: string | any
  ) {
    const nextNode = await this.botsService.getBotNode(node.next[0]);
    return this.handleNode(nextNode, message, userId);
  }

  async TransferToAgent(message: any, node: BotFlowNode, userId: string | any) {
    const { botId, mode, conversationId, botName } =
      this.socketStateService.getUserData(userId);

    if (!node.next.length) {
      return;
    }

    const nextNodes = await Promise.all(
      node.next.map(async (nodeId: string) => {
        return await this.botsService.getBotNode(nodeId);
      })
    );

    const successNode = nextNodes.find((ele: BotFlowNode) => {
      return ele.nodeType === NodeTypeEnum.SUCCESS;
    });

    const failureNode = nextNodes.find((ele: BotFlowNode) => {
      return ele.nodeType === NodeTypeEnum.FAILURE;
    });

    const agent = await this.agentService.assignAgent(botId);

    if (!agent) {
      await this.sendBotMessage(userId, [
        {
          value:
            'No agent is available at the moment. Please try again later. Enter "Start" to restart the conversation.',
          type: "text",
          info: "error",
        },
      ]);
      return this.handleNode(failureNode, message, userId);
    }
    this.logger.debug(
      "Chat transfered is being forwarded to agent" + agent.name
    );
    this.eventEmitter.emit("conversation.created.agent", {
      agentId: agent.id,
      conversationId: conversationId,
    });

    this.eventEmitter.emit("agent.added.visitor", {
      agentId: agent.id,
      visitorId: userId,
    });
    const assignedAgentId = agent.id;

    if (mode !== ModeEnum.preview) {
      await this.conversationService.transferConversationToAgent(
        conversationId,
        assignedAgentId
      );
    }
    const conversation = {
      _id: conversationId,
      visitor: {
        _id: userId,
        name: this.user.auth.name,
      },
      bot: {
        _id: botId,
        name: botName,
      },
      chats: [],
    };

    await this.sendBotMessage(userId, [
      {
        type: "text",
        value: `Welcome to ${botName}. I am ${agent.name}, How may I assist you?`,
        switchToAgent: true,
        agentName: agent.name,
        info: "success",
      },
    ]);
    this.socketStateService.updateUserData(userId, {
      handledByAgent: true,
      assignedAgentId,
    });

    this.emitEventToUser(assignedAgentId, "new-visitor", conversation);
    this.socketStateService.updateUserData(userId, {
      currentNode: successNode,
    });
  }

  async handleAttachmentInput(
    message: any,
    node: BotFlowNode,
    userId: string | any
  ) {
    const nextNode = await this.botsService.getBotNode(node.next[0]);

    if (node.payload.alias) {
      this.socketStateService.updateUserData(userId, {
        attributes: {
          ...this.socketStateService.getUserData(userId).attributes,
          [node.payload.alias]: message,
        },
      });
    }

    return this.handleNode(nextNode, message, userId);
  }

  async handleQuestion(message: any, node: BotFlowNode, userId: string | any) {
    const questionNodeState = this.socketStateService.getQuestionNodeState(
      userId,
      node.id
    );

    if (!questionNodeState) {
      this.socketStateService.setQuestionNodeState(userId, node.id, {
        currentQuestion: -1,
        lifespan: 0,
      });
    }
    const { currentQuestion, lifespan } =
      this.socketStateService.getQuestionNodeState(userId, node.id);

    const nextNodes = await Promise.all(
      node.next.map(async (nodeId: string) => {
        return await this.botsService.getBotNode(nodeId);
      })
    );
    const successNode = nextNodes.find((ele: BotFlowNode) => {
      return ele.nodeType === NodeTypeEnum.SUCCESS;
    });
    const failureNode = nextNodes.find((ele: BotFlowNode) => {
      return ele.nodeType === NodeTypeEnum.FAILURE;
    });

    const elements = node.payload.elements;

    if (!elements) {
      return this.handleNode(failureNode, message, userId);
    }

    if (currentQuestion === -1) {
      const element = elements[0];
      const { prompt } = element;
      await this.sendBotMessage(userId, [
        {
          type: "text",
          value: prompt,
        },
      ]);
      this.socketStateService.setQuestionNodeState(userId, node.id, {
        currentQuestion: 0,
      });
    }
    if (currentQuestion !== -1) {
      const element = elements[currentQuestion];

      const {
        entity,
        alias,
        lifespan: attempt,
        actionOnFailure,
        secure,
      } = element;

      if (this.validationCheck(entity, message)) {
        this.socketStateService.setQuestionNodeState(userId, node.id, {
          currentQuestion: currentQuestion + 1,
          lifespan: 0,
        });
        if (alias) {
          this.socketStateService.updateUserData(userId, {
            attributes: {
              [alias]: message,
            },
          });
        }

        if (secure) {
          this.eventEmitter.emit("mask.chat", this.chatId);
        }

        if (currentQuestion + 1 >= elements.length) {
          return this.handleNode(successNode, message, userId);
        }
        const nextElement = elements[currentQuestion + 1];
        await this.sendBotMessage(userId, [
          {
            type: "text",
            value: nextElement.prompt,
          },
        ]);
      } else {
        if (!attempt || attempt === -1) {
          await this.sendBotMessage(userId, [
            {
              type: "text",
              value: element.prompt,
            },
          ]);
        }

        const haveLifespan = lifespan + 1 < attempt;

        if (haveLifespan && attempt && attempt > 0) {
          this.socketStateService.setQuestionNodeState(userId, node.id, {
            lifespan: lifespan + 1,
            currentQuestion: currentQuestion,
          });
          return await this.sendBotMessage(userId, [
            {
              type: "text",
              value: element.prompt,
            },
          ]);
        } else {
          if (actionOnFailure === "continue") {
            this.socketStateService.setQuestionNodeState(userId, node.id, {
              lifespan: 0,
              currentQuestion: currentQuestion + 1,
            });
            if (currentQuestion + 1 >= elements.length) {
              this.socketStateService.setQuestionNodeState(userId, node.id, {});
              return this.handleNode(successNode, message, userId);
            }
            const nextElement = elements[currentQuestion + 1];
            await this.sendBotMessage(userId, [
              {
                type: "text",
                value: nextElement.prompt,
              },
            ]);
          }
          if (actionOnFailure === "fallback") {
            this.socketStateService.setQuestionNodeState(userId, node.id, {});
            return this.handleNode(failureNode, message, userId);
          }
        }
      }
    }
  }

  async handleSetAttributes(
    message: any,
    node: BotFlowNode,
    userId: string | any
  ) {
    const nextNode = await this.botsService.getBotNode(node.next[0]);

    const attributes = node.payload.attributes;

    if (attributes.length > 0) {
      const existedAttributes =
        this.socketStateService.getUserData(userId).attributes;
      if (existedAttributes) {
        const mewAttributes = attributes.reduce((acc, ele: any) => {
          return {
            ...acc,
            [ele.to]: existedAttributes[ele.set] || "",
          };
        }, {});

        this.socketStateService.updateUserData(userId, {
          attributes: {
            ...existedAttributes,
            ...mewAttributes,
          },
        });
      }
    }

    return this.handleNode(nextNode, message, userId);
  }

  async handleCloseChat(message: any, node: BotFlowNode, userId: string | any) {
    const { startNode, botSettings, conversationId } =
      this.socketStateService.getUserData(userId);
    this.socketStateService.updateUserData(userId, {
      attributes: {},
      currentNode: startNode,
      BotNodeState: {},
      questionNodeState: {},
    });

    if (botSettings?.askForFeedback) {
      this.emitEventToUser(userId, "ask-for-feedback", {});
    }
    await this.sendBotMessage(userId, [
      {
        type: "text",
        value: botSettings?.thankyoumsg || "Thank you for contacting us.",
      },
      {
        type: "text",
        value: 'To start again type "start"',
      },
    ]);
    this.eventEmitter.emit("end.conversation", { conversationId, userId });
  }

  async findAnswerFromQuestionBank(message: string, language = this.language) {
    const response = await this.questionsService.findAnswer(message, language);
    if (response) {
      return response;
    }
    return null;
  }

  async sendBotMessage(
    userId: string,
    message: MessageResponseDto[] | any,
    event?: string
  ) {
    const data = {
      event: event || "chat-message-bot",
      userId,
    };

    if (typeof message === "string") {
      message = [message];
    }

    const userData = this.socketStateService.getUserData(userId);
    if (!userData) return;
    const { botId, conversationId, mode, platform, handledByAgent } = userData;

    const messageDelay = this.delay[conversationId] || 0;

    const nodeDelay = parseInt(this.configService.get("delay.node")) || 1000;
    const message_delay =
      parseInt(this.configService.get("delay.message")) || 750;

    message.map((ele: any, index: number) => {
      if (ele.type === ChatTypeEnum.RANDOM_TEXT) {
        ele.value =
          ele.values.length > 0
            ? ele.values[Math.floor(Math.random() * ele.values.length)]
            : "";
        ele.type = ChatTypeEnum.TEXT;
      }
      const messageResponse: MessageResponseDto = {
        id: generateId("message", 10),
        senderId: botId,
        type: ele.type,
        value: ele.value,
        buttons: ele.buttons,
        time: new Date(),
        delay: 2000,
        switchToAgent: ele.switchToAgent || false,
        agentId: ele.agentId || "",
        location: ele.location,
        info: ele.info,
        handledByAgent: handledByAgent || false,
      };

      if (mode !== ModeEnum.preview) {
        this.eventEmitter.emit("create.new.chat", {
          message: ele.value,
          type: ele.type,
          sender: botId,
          conversationId: conversationId,
        });
      }

      setTimeout(() => {
        this.redisPropagatorService.propagateEvent({
          ...data,
          data: {
            message: messageResponse,
          },
          platform,
        });
      }, messageDelay + index * message_delay);
    });

    this.delay[conversationId] =
      messageDelay + (message.length - 1) * message_delay + nodeDelay;
  }

  async sendMessageToAgent(userId: string, message: any, visitor: SocketState) {
    const data = {
      event: "message",
      userId,
    };

    const { mode, conversationId } = visitor;
    if (mode !== ModeEnum.preview && conversationId && message.value) {
      this.eventEmitter.emit("create.new.chat", {
        sender: message.from,
        message: message.value,
        type: message.type,
        conversationId,
      });
    }
    const messageResponse: MessageResponseDto = {
      id: generateId("message", 10),
      sender: message.from,
      type: message.type,
      value: message.value,
      time: new Date(),
      delay: 2000,
    };

    return this.redisPropagatorService.propagateEvent({
      ...data,
      data: {
        message: messageResponse,
        conversationId,
      },
    });
  }

  @OnEvent("send-telegram-message", { async: true })
  async onSendTelegramMessage(data: { message: any; ctx: any }) {
    await this.sendMessageToTelegram(data.message, data.ctx);
  }

  @OnEvent("send-facebook-message", { async: true })
  async onSendFacebookMessage(data: { message: any; ctx: any }) {
    await this.sendFacebookMessage(data.message, data.ctx);
  }

  @OnEvent("send-whatsapp-message", { async: true })
  async onSendWhatsappMessage(data: { message: any; ctx: any }) {
    await this.sendWhatsappMessage(data.message, data.ctx);
  }

  async sendMessageToTelegram(
    messageResponse: MessageResponseDto | any,
    ctx = this.ctx
  ) {
    if (!ctx || !messageResponse) return;

    try {
      if (messageResponse.type === ChatTypeEnum.TEXT) {
        return await ctx?.reply(messageResponse.value);
      }
      if (messageResponse.type === ChatTypeEnum.IMAGE) {
        return await ctx?.replyWithPhoto(messageResponse.value);
      }
      if (messageResponse.type === ChatTypeEnum.MAPS) {
        return await ctx?.replyWithLocation(
          messageResponse.location.latitude,
          messageResponse.location.longitude
        );
      }
      if (messageResponse.type === ChatTypeEnum.AUDIO) {
        return await ctx?.replyWithAudio(messageResponse.value);
      }
      if (messageResponse.type === ChatTypeEnum.VIDEO) {
        return await ctx?.replyWithVideo(messageResponse.value);
      }
      if (messageResponse.type === ChatTypeEnum.FILE) {
        return await ctx?.replyWithDocument(messageResponse.value);
      }
      if (messageResponse.type === ChatTypeEnum.BUTTONS) {
        let buttons = messageResponse.buttons.map((ele: any) => {
          return Markup.button.callback(ele.title, ele.value);
        });
        buttons = Markup.inlineKeyboard(buttons);

        return await ctx?.reply(messageResponse.value, {
          ...buttons,
        });
      }
    } catch (error) {
      this.logger.error(`Error sending message to telegram: ${error}`);
    }
  }

  emitEventToUser(userId: string, event: string, data: any, platform?: string) {
    const eventData = {
      event,
      userId,
    };
    const userData = this.socketStateService.getUserData(userId);
    if (!userData) return;

    const { mode, conversationId, ctx } = userData;
    platform = platform || userData.platform;

    if (mode !== ModeEnum.preview && conversationId && data.message?.value) {
      this.eventEmitter.emit("create.new.chat", {
        sender: data.message.senderId || data.message.sender,
        message: data.message.value,
        type: data.message.type,
        conversationId,
      });
    }

    // if (platform === PlatformEnum.TELEGRAM) {
    //   return this.sendMessageToTelegram(
    //     {
    //       ...eventData,
    //       ...data.message,
    //     },
    //     ctx
    //   );
    // }
    // if (platform === PlatformEnum.FACEBOOK) {
    //   return this.sendFacebookMessage(
    //     {
    //       ...eventData,
    //       ...data,
    //     },
    //     ctx
    //   );
    // }
    // if (platform === PlatformEnum.WHATSAPP) {
    //   return this.sendWhatsappMessage(
    //     {
    //       ...eventData,
    //       ...data,
    //     },
    //     ctx
    //   );
    // }

    return this.redisPropagatorService.propagateEvent({
      ...eventData,
      data,
      platform,
    });
  }

  async saveUnansweredMessage(message: string, userId: string) {
    const { botId } = this.socketStateService.getUserData(userId);
    if (this.checkIfQuestionIsProper(message)) {
      this.logger.debug(`Adding question to Unanswered Questions: ${message}`);
      await this.unansweredService.create({
        botId,
        questions: {
          question: message,
          askedBy: userId,
          time: new Date(),
        },
      });
    }
  }

  checkIfQuestionIsProper(message: any) {
    this.logger.debug(`Checking if question is proper: ${message}`);
    if (!message) {
      this.logger.debug(`Question is empty`);
      return false;
    }
    message = message.toLowerCase();
    if (typeof message === "string") message = message.trim();

    if (isCreditCard(message)) {
      this.logger.debug(`Question is a credit card`);
      return false;
    }

    if (isDate(message)) {
      this.logger.debug(`Question is a date`);
      return false;
    }
    if (isCurrency(message)) {
      this.logger.debug(`Question is a currency`);
      return false;
    }

    if (IsUrl(message)) {
      this.logger.debug(`Question is a url`);
      return false;
    }

    if (isMACAddress(message)) {
      this.logger.debug(`Question is a MAC Address`);
      return false;
    }

    if (isMobilePhone(message)) {
      this.logger.debug(`Question is a mobile phone`);
      return false;
    }

    if (isIP(message)) {
      this.logger.debug(`Question is an IP`);
      return false;
    }

    if (!isNaN(message)) {
      this.logger.debug(`Question is a number`);
      return false;
    }

    if (isEmail(message)) {
      this.logger.debug(`Question is an email`);
      return false;
    }

    let words = message.split(" ");
    words = [...new Set(words)];

    const filteredWords = words.filter((ele: string) => {
      return ele.length > 2;
    });

    if (filteredWords.length > 2) {
      return true;
    }
    this.logger.debug(`Question is not proper ${message}.Not adding to DB`);
    return false;
  }

  async sendFacebookMessage(
    messageResponse: MessageResponseDto | any,
    ctx = this.ctx
  ) {
    if (!ctx || !ctx.sender_psid) return;
    if (!messageResponse) return;
    const request_body = {
      recipient: {
        id: this.ctx.sender_psid,
      },
      message: {},
    };

    if (messageResponse.type === ChatTypeEnum.TEXT) {
      request_body.message = {
        text: messageResponse.value,
      };
    }
    if (messageResponse.type === ChatTypeEnum.IMAGE) {
      request_body.message = {
        attachment: {
          type: "image",
          payload: {
            url: messageResponse.value,
          },
        },
      };
    }
    if (messageResponse.type === ChatTypeEnum.BUTTONS) {
      request_body.message = {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements: [
              {
                title: messageResponse.value,
                buttons: messageResponse.buttons.map((ele: any) => {
                  return {
                    type: "postback",
                    title: ele.title,
                    payload: ele.value,
                  };
                }),
              },
            ],
          },
        },
      };
    }
    if (messageResponse.type === ChatTypeEnum.QUICK_REPLY) {
      request_body.message = {
        text: messageResponse.value,
        quick_replies: messageResponse.buttons.map((ele: any) => {
          return {
            content_type: "text",
            title: ele.title,
            payload: ele.value,
          };
        }),
      };
    }
    if (messageResponse.type === ChatTypeEnum.AUDIO) {
      request_body.message = {
        attachment: {
          type: "audio",
          payload: {
            url: messageResponse.value,
          },
        },
      };
    }
    if (messageResponse.type === ChatTypeEnum.VIDEO) {
      request_body.message = {
        attachment: {
          type: "video",
          payload: {
            url: messageResponse.value,
          },
        },
      };
    }

    try {
      await firstValueFrom(
        this.httpService.post(
          "https://graph.facebook.com/v15.0/me/messages",
          request_body,
          {
            params: {
              access_token: ctx.accessToken,
            },
          }
        )
      );

      //this.logger.log(`Message sent! ${JSON.stringify(response.data)}`);
    } catch (error) {
      const errorMessages = error.response?.data?.error?.message;
      this.logger.error(`Unable to send message. ${errorMessages}`);
    }
  }

  async sendWhatsappMessage(messageResponse: any, ctx = this.ctx) {
    try {
      if (!ctx || !ctx.recipient) return;
      if (!messageResponse) return;

      if (messageResponse.type === ChatTypeEnum.TEXT) {
        await ctx.Whatsapp.sendText({
          recipientPhone: this.ctx.recipient,
          message: messageResponse.value,
        });
      }
      if (messageResponse.type === ChatTypeEnum.IMAGE) {
        await ctx.Whatsapp.sendImage({
          recipientPhone: this.ctx.recipient,
          url: messageResponse.value,
        });
      }
      if (messageResponse.type === ChatTypeEnum.BUTTONS) {
        await ctx.Whatsapp.sendSimpleButtons({
          recipientPhone: this.ctx.recipient,
          text: messageResponse.value,
          buttons: messageResponse.buttons.map((ele: any) => {
            return {
              type: "postback",
              title: ele.title,
              payload: ele.value,
            };
          }),
        });
      }
    } catch (error) {
      this.logger.error(`Unable to send message. ${error.message}`);
    }
  }

  @OnEvent("end-conversation-by-agent", { async: true })
  async endConversationByAgent(data: { userId: string }) {
    this.logger.debug(`End conversation by agent: ${data.userId}`);
    const userData = this.socketStateService.getUserData(data.userId);
    if (userData) {
      const { currentNode } = userData;
      if (currentNode && currentNode.next.length > 0) {
        const nextNodes = await Promise.all(
          currentNode.next.map(async (nodeId: string) => {
            return await this.botsService.getBotNode(nodeId);
          })
        );

        this.socketStateService.updateUserData(data.userId, {
          currentNode: nextNodes[0],
          handledByAgent: false,
          assignedAgentId: null,
        });

        this.sendBotMessage(data.userId, [
          {
            type: "text",
            value:
              "Your conversation has been ended by the agent. Bot will take over now.",
            info: "warning",
          },
        ]);
        return this.handleNode(nextNodes[0], "", data.userId);
      }
    }
  }

  @OnEvent("report-conversation", { async: true })
  async reportConversation(data: { userId: string }) {
    this.logger.debug(`Report conversation: ${data.userId}`);
    await this.sendBotMessage(data.userId, [
      {
        type: "text",
        value:
          "Agent marked this conversation as inappropriate. You will not be able to chat with this agent again.",
        info: "error",
      },
    ]);

    return this.emitEventToUser(data.userId, "conversation-reported", {});
  }

  @OnEvent("publish-events", { async: true })
  async publishEvent(data: { userId: string; event: string; data: any }) {
    this.logger.debug(`Publish event: ${data.userId}`);
    return this.emitEventToUser(data.userId, data.event, data.data);
  }
}
