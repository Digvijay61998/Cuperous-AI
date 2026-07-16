import { HttpException, Inject, Injectable, Logger } from "@nestjs/common";
import mongoose, { Model } from "mongoose";
import { getDaySubtitle } from "src/util/get-subtitle";
import { SEGMENT_PROVIDER } from "./constant";
import { CreateSegmentDto } from "./dto/create-segment.dto";
import { SegmentDocument } from "./entities/segments.entity";
import { ObjectId } from "bson";
import { ConversationStatusEnum } from "src/conversation/enums/conversation-status.enum";
import { JwtPayload } from "src/auth/strategy/jwt.strategy";
import { SegmentQueryParams } from "./dto/get-segment.params.dto";
import { ComparisonDto } from "src/util/comparison.dto";

@Injectable()
export class SegmentsService {
  private readonly logger = new Logger(SegmentsService.name);

  constructor(
    @Inject(SEGMENT_PROVIDER)
    private segmentModel: Model<SegmentDocument>
  ) {}

  async create(createSegmentDto: CreateSegmentDto) {
    try {
      const segment = new this.segmentModel({
        ...createSegmentDto,
      });
      return segment.save();
    } catch (error) {
      this.logger.error(`Error while creating segment: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findAll() {
    try {
      return this.segmentModel.find().populate("visitors", "name email");
    } catch (error) {
      this.logger.error(`Error while fetching segments: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getVisitors(segmentId: string) {
    try {
      const segment = await this.segmentModel
        .findOne({ _id: segmentId })
        .populate({
          path: "visitors.visitorId",
          populate: {
            path: "bot",
            select: "name",
          },
          options: {
            limit: 1,
          },
        });

      return segment.visitors;
    } catch (error) {
      this.logger.error(`Error while fetching visitors: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async addVisitor(segmentId: string, visitorId: string) {
    try {
      const segment = await this.segmentModel.findOne({
        _id: segmentId,
      });
      if (segment) {
        const existingVisitors = segment.visitors.map((visitor) =>
          visitor.visitorId.toString()
        );
        console.log({ existingVisitors: existingVisitors.includes(visitorId) });
        if (!existingVisitors.includes(visitorId)) {
          segment.visitors.push({
            visitorId: new ObjectId(visitorId),
          });
          return segment.save();
        } else {
          throw new HttpException("Visitor already exists", 400);
        }
      }
    } catch (error) {
      this.logger.error(`Error while adding visitor: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async removeVisitor(segmentId: string, visitorId: string) {
    try {
      const segment = await this.segmentModel.findOne({
        _id: segmentId,
      });
      if (!segment) {
        throw new Error("Segment not found");
      }

      const existingVisitors = segment.visitors.map((visitor) =>
        visitor.visitorId.toString()
      );

      if (existingVisitors.includes(visitorId)) {
        segment.visitors = segment.visitors.filter(
          (visitor) => visitor.visitorId.toString() !== visitorId
        );
      }

      return segment.save();
    } catch (error) {
      this.logger.error(`Error while removing visitor: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async removeSegment(segmentId: string) {
    try {
      return this.segmentModel.deleteOne({ _id: segmentId });
    } catch (error) {
      this.logger.error(`Error while removing segment: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getSegmentsForNode() {
    const segments = await this.segmentModel.find();

    return segments.map((segment) => ({
      id: segment._id,
      name: segment.name,
    }));
  }

  async getTotalCount(days = 30) {
    const total = await this.segmentModel.countDocuments();
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.segmentModel.countDocuments({
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
      title: "Total Segments",
      subtitle: getDaySubtitle(days),
      type: "segment",
    };
  }

  async VisitorCount(days = 30) {
    const response = await this.segmentModel.aggregate([
      { $unwind: "$visitors" },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          agoCount: {
            $sum: {
              $cond: [
                {
                  $gte: [
                    "$visitors.addedAt",
                    new Date(new Date().setDate(new Date().getDate() - days)),
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          total: "$total" || 0,
          agoCount: "$agoCount" || 0,
        },
      },
    ]);
    if (response.length === 0) {
      return {
        stats: 0,
        trendNumber: 0,
        trend: "positive",
        title: "Total Visitors",
        subtitle: getDaySubtitle(days),
        type: "visitor",
      };
    }
    const { total, agoCount } = response[0];
    const percentageChange = Math.round((agoCount / total) * 100);
    return {
      stats: total,
      trendNumber: percentageChange,
      trend: percentageChange >= 0 ? "positive" : "negative",
      title: "Total Visitors",
      subtitle: getDaySubtitle(days),
    };
  }

  async newVisitorCount(days = 7) {
    const response = await this.segmentModel.aggregate([
      { $unwind: "$visitors" },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          agoCount: {
            $sum: {
              $cond: [
                {
                  $gte: [
                    "$visitors.addedAt",
                    new Date(new Date().setDate(new Date().getDate() - days)),
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          total: "$total" || 0,
          agoCount: "$agoCount" || 0,
        },
      },
    ]);
    if (response.length === 0) {
      return {
        stats: 0,
        trendNumber: 0,
        trend: "positive",
        title: "New Visitors",
        subtitle: getDaySubtitle(days),
        type: "visitor",
      };
    }
    const { total, agoCount } = response[0];
    const percentageChange = Math.round((agoCount / total) * 100);
    return {
      stats: total,
      trendNumber: percentageChange,
      trend: percentageChange >= 0 ? "positive" : "negative",
      title: "New Visitors",
      subtitle: getDaySubtitle(days),
    };
  }

  async getSegmentStats(days = 2) {
    const result = await Promise.all([
      this.getTotalCount(days),
      this.VisitorCount(days),
      this.newVisitorCount(days),
    ]);

    return result;
  }

  async getAllSegmentsOfVisitor(visitorId: string) {
    const segments = await this.segmentModel
      .find({
        "visitors.visitorId": visitorId,
      })
      .select("name");
    return segments;
  }

  async activeStats(user: JwtPayload) {
    const totalActive = await this.segmentModel.countDocuments({
      status: ConversationStatusEnum.IN_PROGRESS,
    });

    const myActive = await this.segmentModel.countDocuments({
      status: ConversationStatusEnum.IN_PROGRESS,
      agents: { $in: [user._id] },
    });

    const activeAnonymously = await this.segmentModel.countDocuments({
      status: ConversationStatusEnum.IN_PROGRESS,
    });
  }

  async findSegmentsVisitorsCount() {
    const segments = await this.segmentModel.aggregate([
      {
        $project: {
          name: 1,
          numberOfVisitors: {
            $cond: {
              if: { $isArray: "$visitors" },
              then: { $size: "$visitors" },
              else: 0,
            },
          },
        },
      },
    ]);
    return segments;
  }
  async findSegmentsVisitorsStats(query: SegmentQueryParams) {
    try {
      const { startDate, endDate, segmentId } = query;

      const queryObject = {};
      if (segmentId) queryObject["id"] = segmentId;
      if (startDate) queryObject["createdAt"] = { $gte: startDate };
      if (endDate) queryObject["createdAt"] = { $lte: endDate };
      if (startDate && endDate)
        queryObject["createdAt"] = { $gte: startDate, $lte: endDate };
      const segments = this.segmentModel.find(queryObject);
      return segments;
    } catch (error) {
      this.logger.error(`Error while getting all visitors : ${error.message}`);
      // throw new HttpException(error.message, error.status || 500);
    }
  }

  async getDayWisePerformance(params: SegmentQueryParams) {
    const { segmentId, startDate } = params;
    let endDate = params.endDate;
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

    if (segmentId) {
      match["_id"] = new ObjectId(segmentId);
    }

    try {
      const data = await this.segmentModel.aggregate([
        {
          $match: match,
        },
        {
          $unwind: {
            path: "$visitors",
          },
        },
        {
          $group: {
            _id: {
              $isoDayOfWeek: "$visitors.addedAt",
            },
            total: { $sum: 1 },
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
            _id: 0,
          },
        },
      ]);
      return data;
    } catch (error) {
      this.logger.error(
        `Error while getting bot conversation performance ${error}`
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getDateWiseSegmentVisitors(params: SegmentQueryParams) {
    const { segmentId, startDate } = params;
    let endDate = params.endDate;
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

    if (segmentId) {
      match["_id"] = new ObjectId(segmentId);
    }

    try {
      const data = await this.segmentModel.aggregate([
        {
          $match: match,
        },
        {
          $unwind: {
            path: "$visitors",
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$visitors.addedAt",
              },
            },
            total: { $sum: 1 },
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
            _id: 0,
          },
        },
      ]);
      return data;
    } catch (error) {
      this.logger.error(`Error while getting date wise conversations ${error}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getDateWiseSegmentCompare(query: ComparisonDto) {
    try {
      const { param1, param2, startDate } = query;
      let endDate = query.endDate;
      if (!endDate) {
        endDate = new Date().toISOString();
      }

      const match = {};

      if (!startDate) {
        match["visitors.addedAt"] = {
          $lte: new Date(endDate),
        };
      }

      if (startDate && endDate) {
        match["visitors.addedAt"] = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const result = await this.segmentModel.aggregate([
        {
          $unwind: "$visitors",
        },
        {
          $match: match,
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$visitors.addedAt",
              },
            },
            segment1: {
              $sum: {
                $cond: {
                  if: { $eq: ["$_id", new ObjectId(param1)] },
                  then: 1,
                  else: 0,
                },
              },
            },
            segment2: {
              $sum: {
                $cond: {
                  if: { $eq: ["$_id", new ObjectId(param2)] },
                  then: 1,
                  else: 0,
                },
              },
            },
          },
        },
        {
          $sort: {
            _id: -1,
          },
        },

        {
          $project: {
            _id: 0,
            date: "$_id",
            segment1: 1,
            segment2: 1,
          },
        },
      ]);

      return result;
    } catch (err) {
      this.logger.error(
        `Error in getting offer dae wise compare ${err.message}`
      );

      throw new HttpException(err.message, err.status || 500);
    }
  }
}
