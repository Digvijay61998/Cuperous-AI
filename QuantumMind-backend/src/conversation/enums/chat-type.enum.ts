export enum ChatTypeEnum {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
  BUTTONS = 'buttons',
  QUICK_REPLY = 'quick_reply',
  GOTO = 'goto',
  RANDOM_TEXT = 'random_text',
  MAPS = 'maps',
  GALLERY = 'gallery',
  /**
   * A hosted template launch. Rendered by the web widget as an embedded panel
   * (see TemplatePanel) instead of a link that leaves the page. Channels that
   * cannot embed fall back to a plain text/cta_url message in handleOpenTemplate.
   */
  TEMPLATE = 'template',
}
