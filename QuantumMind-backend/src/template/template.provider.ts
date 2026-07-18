import { Connection } from 'mongoose';
import { DATABASE_PROVIDER } from 'src/constants';
import { TEMPLATE_PROVIDER } from './constant';
import { Template, TemplateSchema } from './entities/template.entity';

export const TemplateProviders = [
  {
    provide: TEMPLATE_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(Template.name, TemplateSchema),
    inject: [DATABASE_PROVIDER],
  },
];
