import {
  HttpException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { Model } from "mongoose";
import { JwtPayload } from "src/auth/strategy/jwt.strategy";
import { TICKET_DETAILS_PROVIDER, TICKET_PROVIDER } from "./constant";
import { CreateActivityDto } from "./dto/create-activity.dto";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { UpdateTicketDto } from "./dto/update-ticket.dto";
import { TicketActivitiesDocument } from "./entities/ticket-activities.entity";
import { TicketDocument } from "./entities/ticket.entity";
import { TicketActivitiesEnum } from "./enums/ticket-activities.enum";
import { VisitorService } from "src/visitor/visitor.service";
import { TicketStatusEnum } from "./enums/ticket-status.enum";
import { getDaySubtitle } from "src/util/get-subtitle";
import { ReportParamsDto } from "src/util/report-params.dto";
import { SearchParamDto } from "./dto/search-param.dto";
import { TicketPriorityEnum } from "./enums/ticket-priority";
import { EventEmitter2 } from "@nestjs/event-emitter";
import moment from "moment";

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);
  constructor(
    @Inject(TICKET_PROVIDER) private ticketModel: Model<TicketDocument>,
    @Inject(TICKET_DETAILS_PROVIDER)
    private ticketDetailsModel: Model<TicketActivitiesDocument>,
    private readonly eventEmitter: EventEmitter2,

    private visitorService: VisitorService
  ) {}

  async create(createTicketDto: CreateTicketDto) {
    try {
      const ticket = await this.ticketModel.create(createTicketDto);
      const activities = await this.ticketDetailsModel.create({
        ticket: ticket._id,
        message: `Service Request Created`,
        date: new Date().toISOString(),
        status: TicketActivitiesEnum.CREATED,
      });

      ticket.activities.push(activities);
      await ticket.save();
      await this.visitorService.addServiceRequests(
        createTicketDto.visitor,
        ticket._id
      );
      return ticket;
    } catch (error) {
      this.logger.error(`Error while creating ticket : ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async assignTicketToMe(ticketId: string, user: JwtPayload) {
    try {
      const ticket = await this.ticketModel.findOne({
        _id: ticketId,
      });
      if (!ticket) {
        throw new NotFoundException(`Ticket not found`);
      }

      ticket.agents.push(user._id);

      this.eventEmitter.emit("ticket.assigned.agent", {
        ticketId: ticket._id,
        agentId: user._id,
      });
      const activities = await this.ticketDetailsModel.create({
        ticket: ticket._id,
        message: `Ticket assigned to ${user.email}`,
        date: new Date().toISOString(),
        status: TicketActivitiesEnum.ASSIGNED,
      });
      ticket.activities.push(activities);
      await ticket.save();
      return ticket;
    } catch (error) {
      this.logger.error(`Error while assigning ticket : ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async markAsResolved(ticketId: string, user: JwtPayload) {
    try {
      const ticket = await this.ticketModel.findOne({
        _id: ticketId,
      });
      if (!ticket) {
        throw new NotFoundException(`Ticket not found`);
      }
      ticket.status = TicketStatusEnum.CLOSED;
      ticket.closedAt = new Date();

      const activities = await this.ticketDetailsModel.create({
        ticket: ticket._id,
        message: `Ticket marked as resolved by ${user.email}`,
        date: new Date().toISOString(),
        status: TicketActivitiesEnum.RESOLVED,
      });
      ticket.activities.push(activities);
      await ticket.save();
      return ticket;
    } catch (error) {
      this.logger.error(`Error while assigning ticket : ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findAll(query: SearchParamDto) {
    try {
      const {
        skip: documentsToSkip,
        limit: limitOfDocuments,
        tags,
        status,
        startDate,
        bot,
      } = query;

      const endDate = query.endDate || new Date().toISOString();

      const queryObject = {};
      if (status) queryObject["status"] = status;
      if (tags) queryObject["tags"] = { $in: tags };
      if (bot) queryObject["bot"] = bot;

      if (startDate && endDate) {
        queryObject["createdAt"] = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const tickets = this.ticketModel
        .find(queryObject)
        .sort({ createdAt: -1 })
        .populate("agents", "name")
        .populate("bot", "name")
        .populate("visitor", "name email phone")
        .skip(documentsToSkip);
      if (limitOfDocuments) {
        tickets.limit(limitOfDocuments);
      }

      const data = await tickets.exec();

      const count = await this.ticketModel.countDocuments(queryObject);

      return { data, count };
    } catch (error) {
      this.logger.error(`Error while getting all tickets : ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findOne(id: string) {
    try {
      const ticket = await this.ticketModel
        .findOne({ _id: id })
        .populate("activities")
        .populate("agents", "name")
        .populate("bot", "name")
        .populate("visitor", "name email phone");
      if (!ticket) throw new NotFoundException("No Ticket found by this id");
      return ticket;
    } catch (error) {
      this.logger.error(
        `Error while getting ticket with id ${id} : ${error.message}`
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async update(id: string, updateTicketDto: UpdateTicketDto) {
    try {
      const ticket = await this.ticketModel.findByIdAndUpdate(
        id,
        updateTicketDto,
        {
          new: true,
        }
      );
      return ticket;
    } catch (error) {
      this.logger.error(
        `Error while updating ticket with id ${id} : ${error.message}`
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async addActivity(id: string, ticketActivity: CreateActivityDto) {
    try {
      const activity = await this.ticketDetailsModel.create({
        ...ticketActivity,
        date: new Date().toISOString(),
      });
      const ticket = await this.ticketModel.findById(id);
      ticket.activities.push(activity._id);
      await ticket.save();
      return activity;
    } catch (error) {
      this.logger.error(
        `Error while adding activity to ticket with id ${id} : ${error.message}`
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getTotalCount(days = 7) {
    const total = await this.ticketModel.countDocuments();

    let percentageChange = 0;

    if (total) {
      const agoCount = await this.ticketModel.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setDate(new Date().getDate() - 60)),
        },
      });
      percentageChange = Math.round((agoCount / total) * 100);
    }
    return {
      stats: total,
      trendNumber: percentageChange,
      trend: percentageChange >= 0 ? "positive" : "negative",
      title: "Total",
      subtitle: getDaySubtitle(days),
      type: "ticket",
    };
  }

  async closedTickets(days = 7) {
    const total = await this.ticketModel.countDocuments({
      status: TicketStatusEnum.CLOSED,
    });
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.ticketModel.countDocuments({
        status: TicketStatusEnum.CLOSED,
        closedAt: {
          $gte: new Date(new Date().setDate(new Date().getDate() - days)),
        },
      });

      percentageChange = Math.round((agoCount / total) * 100);
    }

    return {
      stats: total,
      trendNumber: percentageChange,
      trend: percentageChange >= 0 ? "positive" : "negative",
      title: "Closed",
      subtitle: getDaySubtitle(days),
      type: "ticket",
    };
  }

  async openTickets(days = 7) {
    const total = await this.ticketModel.countDocuments({
      status: TicketStatusEnum.OPEN,
    });
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.ticketModel.countDocuments({
        status: TicketStatusEnum.OPEN,
        createdAt: {
          $gte: new Date(new Date().setDate(new Date().getDate() - days)),
        },
      });

      percentageChange = Math.round((agoCount / total) * 100);
    }
    return {
      stats: total,
      trendNumber: percentageChange,
      trend: percentageChange >= 0 ? "positive" : "negative",
      title: "Open",
      subtitle: getDaySubtitle(days),
      type: "ticket",
    };
  }

  async ticketStats(days = 7) {
    return await Promise.all([
      this.getTotalCount(days),
      this.closedTickets(days),
      this.openTickets(days),
      this.CriticalTickets(days),
    ]);
  }

  async CriticalTickets(days = 7) {
    try {
      const total = await this.ticketModel.countDocuments({
        priority: TicketPriorityEnum.CRITICAL,
      });
      let percentageChange = 0;
      if (total) {
        const agoCount = await this.ticketModel.countDocuments({
          priority: TicketPriorityEnum.CRITICAL,
          createdAt: {
            $gte: new Date(new Date().setDate(new Date().getDate() - days)),
          },
        });
        percentageChange = Math.round((agoCount / total) * 100);
      }
      return {
        stats: total,
        trendNumber: percentageChange,
        trend: percentageChange >= 0 ? "positive" : "negative",
        title: "Critical",
        subtitle: getDaySubtitle(days),
        type: "ticket",
      };
    } catch (error) {
      this.logger.error(
        `Error while getting critical tickets : ${error.message}`
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getTotalTicketsReport() {
    try {
      const response = await this.ticketModel.aggregate([
        {
          $group: {
            _id: "$status",
            total: { $sum: 1 },
            closed: {
              $sum: {
                $cond: [{ $eq: ["$status", TicketStatusEnum.CLOSED] }, 1, 0],
              },
            },
            open: {
              $sum: {
                $cond: [{ $eq: ["$status", TicketStatusEnum.OPEN] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
          },
        },
      ]);

      return response[0];
    } catch (error) {
      this.logger.error(`Error while getting total tickets : ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async dayWisePerformance(query: ReportParamsDto) {
    const { id: botId, startDate } = query;
    let endDate = query.endDate;
    if (!endDate) {
      endDate = new Date().toISOString();
    }

    const match = {};

    if (startDate) {
      match["createdAt"] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (botId) {
      match["bot"] = botId;
    }

    try {
      const response = await this.ticketModel.aggregate([
        {
          $match: match,
        },
        {
          $group: {
            _id: {
              $isoDayOfWeek: "$createdAt",
            },
            total: { $sum: 1 },
            closed: {
              $sum: {
                $cond: [{ $eq: ["$status", TicketStatusEnum.CLOSED] }, 1, 0],
              },
            },
            open: {
              $sum: {
                $cond: [{ $eq: ["$status", TicketStatusEnum.OPEN] }, 1, 0],
              },
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
        {
          $project: {
            day: {
              $switch: {
                branches: [
                  { case: { $eq: ["$_id", 1] }, then: "MON" },
                  { case: { $eq: ["$_id", 2] }, then: "TUE" },
                  { case: { $eq: ["$_id", 3] }, then: "WED" },
                  { case: { $eq: ["$_id", 4] }, then: "THU" },
                  { case: { $eq: ["$_id", 5] }, then: "FRI" },
                  { case: { $eq: ["$_id", 6] }, then: "SAT" },
                  { case: { $eq: ["$_id", 7] }, then: "SUN" },
                ],
              },
            },
            total: 1,
            open: 1,
            closed: 1,
            _id: 0,
          },
        },
      ]);

      return response;
    } catch (error) {
      this.logger.error(
        "Error while getting day wise performance : ${error.message}"
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async dateWisePerformance(query: ReportParamsDto) {
    const { id: botId, startDate } = query;
    let endDate = query.endDate;
    if (!endDate) {
      endDate = new Date().toISOString();
    }

    const match = {};

    if (startDate) {
      match["createdAt"] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (botId) {
      match["bot"] = botId;
    }

    try {
      const response = await this.ticketModel.aggregate([
        {
          $match: match,
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            total: { $sum: 1 },
            closed: {
              $sum: {
                $cond: [{ $eq: ["$status", TicketStatusEnum.CLOSED] }, 1, 0],
              },
            },
            open: {
              $sum: {
                $cond: [{ $eq: ["$status", TicketStatusEnum.OPEN] }, 1, 0],
              },
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
        {
          $project: {
            date: "$_id",
            total: 1,
            open: 1,
            closed: 1,
            _id: 0,
          },
        },
      ]);

      return response;
    } catch (error) {
      this.logger.error(
        "Error while getting date wise performance : ${error.message}"
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async homeTicketCount(filter: any, status?: string) {
    if (!filter) filter = "day";
    try {
      const total = await this.ticketModel.countDocuments({
        createdAt: {
          $gte: new Date(moment().startOf(filter).toISOString()),
        },
        status: status || { $ne: "" },
      });

      let percentageChange = 0;
      const previousTotal = await this.ticketModel.countDocuments({
        createdAt: {
          $gte: new Date(
            moment().subtract(1, filter).startOf(filter).toISOString()
          ),
        },
        status: status || { $ne: "" },
      });

      if (previousTotal) {
        percentageChange = Math.round(
          ((total - previousTotal) / previousTotal) * 100
        );
      }

      return {
        stats: total,
        trendNumber: Math.abs(percentageChange),
        trend: percentageChange > 0 ? "positive" : "negative",
        title:
          status === TicketStatusEnum.OPEN ? "Pendig Tickets" : "Total Tickets",
        type: "service_request",
      };
    } catch (error) {
      this.logger.error(`Error while getting home  count ${error}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }
}
