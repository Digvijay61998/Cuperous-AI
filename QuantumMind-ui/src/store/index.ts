// ** Toolkit imports
import { configureStore } from '@reduxjs/toolkit';

// ** Reducers
import advertisement from 'src/store/apps/advertisement';
import agent from 'src/store/apps/agent';
import flow from 'src/store/apps/bot-flow';
import bots from 'src/store/apps/bots';
import chat from 'src/store/apps/chat';
import conversations from 'src/store/apps/conversation';
import dashboard from 'src/store/apps/dashboard';
import offer from 'src/store/apps/offer';
import preview from 'src/store/apps/preview';
import questionBank from 'src/store/apps/question-bank';
import advertisementsReports from 'src/store/apps/reports/advertisements';
import agentReport from 'src/store/apps/reports/agent';
import botReport from 'src/store/apps/reports/bots';
import offersReports from 'src/store/apps/reports/offers';
import segmentsReports from 'src/store/apps/reports/segments';
import socialReports from 'src/store/apps/reports/social';
import ticketsReport from 'src/store/apps/reports/ticket';
import VisitorsReports from 'src/store/apps/reports/visitors';
import webhookReports from 'src/store/apps/reports/webhooks';
import messaging from 'src/store/apps/messaging';
import segments from 'src/store/apps/segments';
import serviceRequest from 'src/store/apps/service-request';
import social from 'src/store/apps/social';
import states from 'src/store/apps/states';
import tags from 'src/store/apps/tags';
import template from 'src/store/apps/template';
import user from 'src/store/apps/user';
import video from 'src/store/apps/video';
import visitors from 'src/store/apps/visitor';
import webhook from 'src/store/apps/webhook';
import widgetPreview from 'src/store/apps/widget-preview/widget';
import scraper from './apps/scraper';
export const store = configureStore({
  reducer: {
    agent,
    video,
    template,
    user,
    bots,
    chat,
    segments,
    tags,
    flow,
    visitors,
    serviceRequest,
    webhook,
    preview,
    conversations,
    widgetPreview,
    questionBank,
    states,
    advertisement,
    offer,
    social,
    botReport,
    agentReport,
    ticketsReport,
    VisitorsReports,
    webhookReports,
    advertisementsReports,
    offersReports,
    segmentsReports,
    socialReports,
    dashboard,
    scraper,
    messaging,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
