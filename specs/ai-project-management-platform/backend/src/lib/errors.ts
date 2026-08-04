import { GraphQLError } from 'graphql';

export class AuthenticationError extends GraphQLError {
    constructor(message: string) {
        super(message, { extensions: { code: 'UNAUTHENTICATED' } });
    }
}

export class ForbiddenError extends GraphQLError {
    constructor(message: string) {
        super(message, { extensions: { code: 'FORBIDDEN' } });
    }
}

export class NotFoundError extends GraphQLError {
    constructor(message: string) {
        super(message, { extensions: { code: 'NOT_FOUND' } });
    }
}

export class UserInputError extends GraphQLError {
    constructor(message: string) {
        super(message, { extensions: { code: 'BAD_USER_INPUT' } });
    }
}

export class AIGenerationError extends GraphQLError {
    constructor(message: string) {
        super(message, { extensions: { code: 'AI_GENERATION_ERROR' } });
    }
}
