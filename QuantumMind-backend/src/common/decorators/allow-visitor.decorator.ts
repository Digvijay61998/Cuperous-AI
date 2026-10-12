import { SetMetadata } from '@nestjs/common';

export const ALLOW_VISITOR_KEY = 'allowVisitor';

/**
 * Opts a route in to widget tokens (visitor / bot-mode JWTs issued by
 * `WidgetService`). Those tokens are signed with the same secret as dashboard
 * tokens, so without this marker {@link RolesGuard} rejects them on every
 * non-public route — a visitor must never reach tenant dashboard APIs.
 */
export const AllowVisitor = () => SetMetadata(ALLOW_VISITOR_KEY, true);
