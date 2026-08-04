export const typeDefs = `#graphql
  type User {
    id: ID!
    email: String!
    displayName: String!
    avatarUrl: String
    roles: [String!]!
    isActive: Boolean!
    lastLoginAt: String
    createdAt: String!
  }

  type AuthPayload {
    accessToken: String!
    refreshToken: String!
    user: User!
  }

  type WorkspaceSettings {
    allowPublicInvites: Boolean!
    defaultTaskPriority: String!
    aiGenerationEnabled: Boolean!
    maxFileUploadMb: Int!
  }

  type Workspace {
    id: ID!
    name: String!
    slug: String!
    description: String
    ownerId: String!
    settings: WorkspaceSettings!
    isArchived: Boolean!
    createdAt: String!
    members: [WorkspaceMember!]!
  }

  type WorkspaceMember {
    id: ID!
    userId: String!
    workspaceId: String!
    role: String!
    joinedAt: String!
  }

  type Task {
    id: ID!
    workspaceId: String!
    title: String!
    description: String
    status: String!
    priority: String!
    position: Float!
    assigneeId: String
    creatorId: String!
    dueDate: String
    estimatedHours: Float
    tags: [String!]!
    aiGenerated: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type GeneratedTasksPayload {
    tasks: [Task!]!
    tokensUsed: Int!
    model: String!
    promptSummary: String!
  }

  type Notification {
    id: ID!
    userId: String!
    type: String!
    title: String!
    body: String!
    actionUrl: String
    isRead: Boolean!
    createdAt: String!
  }

  type AdminStats {
    totalUsers: Int!
    totalWorkspaces: Int!
    totalTasks: Int!
    totalAIRequests: Int!
  }

  input RegisterInput {
    email: String!
    password: String!
    displayName: String!
  }

  input CreateWorkspaceInput {
    name: String!
    description: String
  }

  input CreateTaskInput {
    workspaceId: ID!
    title: String!
    description: String
    priority: String
    assigneeId: String
    dueDate: String
    estimatedHours: Float
    tags: [String!]
    status: String
  }

  input UpdateTaskInput {
    title: String
    description: String
    priority: String
    assigneeId: String
    dueDate: String
    estimatedHours: Float
    tags: [String!]
  }

  input TaskFilter {
    status: String
    priority: String
    assigneeId: String
    search: String
  }

  type Query {
    me: User
    workspace(id: ID!): Workspace
    workspaces: [Workspace!]!
    task(id: ID!): Task
    tasks(workspaceId: ID!, filter: TaskFilter): [Task!]!
    notifications(unreadOnly: Boolean): [Notification!]!
    adminStats: AdminStats
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    refreshToken(token: String!): AuthPayload!
    logout: Boolean!

    createWorkspace(input: CreateWorkspaceInput!): Workspace!
    inviteMember(workspaceId: ID!, userId: String!, role: String!): WorkspaceMember!

    createTask(input: CreateTaskInput!): Task!
    updateTask(id: ID!, input: UpdateTaskInput!): Task!
    moveTask(id: ID!, status: String!): Task!
    deleteTask(id: ID!): Boolean!
    generateTasks(workspaceId: ID!, prompt: String!): GeneratedTasksPayload!

    markNotificationRead(id: ID!): Notification!
  }

  type Subscription {
    taskUpdated(workspaceId: ID!): Task!
    notificationReceived: Notification!
  }
`;
