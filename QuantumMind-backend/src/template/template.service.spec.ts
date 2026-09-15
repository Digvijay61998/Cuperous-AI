import { TemplateService } from './template.service';

const buildReadService = (template: any) => {
  const chain: any = {
    populate: jest.fn(() => chain),
    then: (resolve: any) => resolve(template),
  };

  const templateModel = {
    findOne: jest.fn(() => chain),
  };

  return new TemplateService(
    templateModel as any,
    {} as any,
    {
      buildHostedUrl: jest.fn(
        (relPath: string) =>
          `http://localhost:4000/api/file/templates/${relPath}/index.html`,
      ),
    } as any,
  );
};

describe('TemplateService', () => {
  it('updates the template hostedUrl when a public URL is provided', async () => {
    const save = jest.fn().mockResolvedValue(true);
    const template = {
      slug: 'demo',
      hostedUrl: 'https://old.example.com/index.html',
      updatedBy: null,
      save,
    };

    const templateModel = {
      findOne: jest.fn().mockResolvedValue(template),
    };

    const service = new TemplateService(
      templateModel as any,
      {} as any,
      { buildHostedUrl: jest.fn() } as any,
    );

    await service.update('507f1f77bcf86cd799439011', {
      hostedUrl: 'https://cdn.example.com/templates/demo/index.html',
    });

    expect(template.hostedUrl).toBe('https://cdn.example.com/templates/demo/index.html');
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('keeps a manually configured hostedUrl when reading the template', async () => {
    const service = buildReadService({
      id: 'tpl1',
      currentVersion: '1.0.0',
      hostedUrl: 'https://cdn.example.com/templates/demo/index.html',
    });

    const result: any = await service.findOne('tpl1');

    expect(result.hostedUrl).toBe(
      'https://cdn.example.com/templates/demo/index.html',
    );
  });

  it('falls back to the generated hostedUrl when none was configured', async () => {
    const service = buildReadService({
      id: 'tpl1',
      currentVersion: '1.0.0',
      hostedUrl: '',
    });

    const result: any = await service.findOne('tpl1');

    expect(result.hostedUrl).toBe(
      'http://localhost:4000/api/file/templates/tpl1/v1.0.0/index.html',
    );
  });
});
