export const FEATURE_FLAG_PROVIDER = 'FEATURE_FLAG_MODEL';

/** Well-known flag keys. Provider-selection keys follow `channel.provider`. */
export const FLAG_KEYS = {
  providerFor: (channel: string) => `${channel}.provider`,
};
