import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AiService } from "./ai.service";
import { CreateKnowledgeDto } from "./dto/create-knowledge.dto";

@Controller("ai")
@ApiTags("AI")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // Add or replace a manual knowledge entry for a client.
  @Post("knowledge")
  async addKnowledge(@Body() dto: CreateKnowledgeDto) {
    return this.aiService.addKnowledge(dto);
  }

  // List a client's manual knowledge entries.
  @Get("knowledge/:clientId")
  async getKnowledge(@Param("clientId") clientId: string) {
    return this.aiService.getKnowledge(clientId);
  }

  // Remove a manual knowledge entry (from both the index and the vector store).
  @Delete("knowledge/:id")
  async removeKnowledge(@Param("id") id: string) {
    return this.aiService.removeKnowledge(id);
  }

  // Per-client AI usage summary + recent records (for billing).
  @Get("usage/:clientId")
  async getUsage(@Param("clientId") clientId: string) {
    return this.aiService.getUsage(clientId);
  }
}
