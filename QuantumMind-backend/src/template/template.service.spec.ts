import { TemplateService } from './template.service';

const TPL_ID = '507f1f77bcf86cd799439011';

const storage = () =>
  ({
    buildHostedUrl: jest.fn(
      (relPath: string) => `http://localhost:4000/api/file/${relPath}/index.html`,
    ),
  } as any);

// TemplateService(templateModel, instanceModel, storage, tenantScope, entitlements)
const makeService = (templateModel: any) =>
  new TemplateService(
    templateModel as any,
    {} as any,
    storage(),
    {} as any,
    {} as any,
  );

const buildReadService = (template: any) => {
  const chain: any = {
    populate: jest.fn(() => chain),
    then: (resolve: any) => resolve(template),
  };
  return makeService({ findOne: jest.fn(() => chain) });
};

describe('TemplateService', () => {
  it('updates editable metadata and saves', async () => {
    const save = jest.fn().mockResolvedValue(true);
    const template: any = { slug: 'demo', name: 'Old', updatedBy: null, save };

    const service = makeService({
      findOne: jest.fn().mockResolvedValue(template),
    });

    await service.update(TPL_ID, { name: 'New' } as any);

    expect(template.name).toBe('New');
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('always serves the generated hostedUrl for the current version', async () => {
    const service = buildReadService({
      id: 'tpl1',
      currentVersion: '1.0.0',
      hostedUrl: 'https://stale.example.com/index.html',
    });

    const result: any = await service.findOne(TPL_ID);

    expect(result.hostedUrl).toBe(
      'http://localhost:4000/api/file/templates/tpl1/v1.0.0/index.html',
    );
  });

  it('rejects a malformed id with 404 instead of a cast error', async () => {
    const service = buildReadService(null);
    await expect(service.findOne('not-an-id')).rejects.toMatchObject({
      status: 404,
    });
  });
});
