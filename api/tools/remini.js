// api/tools/remini.js

import { buildAlyachanImageToolHandler } from '../../src/alyachanTools.js';

const handler = buildAlyachanImageToolHandler({
  providerPath: '/api/tools/remini',
  featureName: 'remini',
  fileBase: 'remini-result',
  successMessage: 'Improve photo quality to be clearer, sharper, and more detailed'
});

export const GET = handler.GET;
export const POST = handler.POST;
export const OPTIONS = handler.OPTIONS;
