/**
 * Plop generator: scaffolds a new template under templates/<slug> wired to the
 * shared SDK. Run with:  pnpm new:template
 */
module.exports = function (plop) {
  plop.setGenerator('template', {
    description: 'Create a new JarCube template',
    prompts: [
      {
        type: 'input',
        name: 'slug',
        message: 'Template slug (kebab-case, e.g. doctor-appointment):',
        validate: (v) =>
          /^[a-z0-9-]+$/.test(v) || 'Use lowercase letters, numbers and hyphens',
      },
      {
        type: 'input',
        name: 'name',
        message: 'Display name (e.g. Doctor Appointment Booking):',
      },
      {
        type: 'list',
        name: 'industry',
        message: 'Industry:',
        choices: [
          'medical',
          'real_estate',
          'restaurant',
          'retail',
          'hotel',
          'education',
          'travel',
          'finance',
          'insurance',
          'salon',
          'automobile',
          'events',
          'lead_generation',
          'crm',
          'ecommerce',
          'other',
        ],
      },
      {
        type: 'list',
        name: 'category',
        message: 'Category:',
        choices: [
          'appointment',
          'booking',
          'checkout',
          'form',
          'survey',
          'feedback',
          'registration',
          'catalog',
          'payment',
          'quotation',
          'membership',
          'lead',
          'order_tracking',
          'other',
        ],
      },
    ],
    actions: [
      {
        type: 'addMany',
        destination: '../templates/{{slug}}',
        base: 'plop-templates/template',
        templateFiles: 'plop-templates/template/**/*',
        globOptions: { dot: true },
      },
    ],
  });
};
