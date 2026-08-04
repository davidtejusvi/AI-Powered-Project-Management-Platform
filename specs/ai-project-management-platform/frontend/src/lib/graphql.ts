import { gql } from '@apollo/client';

// Auth
export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      refreshToken
      user { id email displayName roles }
    }
  }
`;

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      accessToken
      refreshToken
      user { id email displayName roles }
    }
  }
`;

export const LOGOUT = gql`mutation Logout { logout }`;

export const ME = gql`
  query Me {
    me { id email displayName avatarUrl roles }
  }
`;

// Workspaces
export const GET_WORKSPACES = gql`
  query GetWorkspaces {
    workspaces {
      id name slug description ownerId isArchived createdAt
      settings { aiGenerationEnabled defaultTaskPriority maxFileUploadMb }
      members { id userId role }
    }
  }
`;

export const CREATE_WORKSPACE = gql`
  mutation CreateWorkspace($input: CreateWorkspaceInput!) {
    createWorkspace(input: $input) {
      id name slug description ownerId createdAt
      settings { aiGenerationEnabled defaultTaskPriority maxFileUploadMb }
    }
  }
`;

// Tasks
export const GET_TASKS = gql`
  query GetTasks($workspaceId: ID!, $filter: TaskFilter) {
    tasks(workspaceId: $workspaceId, filter: $filter) {
      id workspaceId title description status priority position
      assigneeId creatorId dueDate estimatedHours tags aiGenerated createdAt updatedAt
    }
  }
`;

export const CREATE_TASK = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      id title status priority position tags aiGenerated createdAt
    }
  }
`;

export const UPDATE_TASK = gql`
  mutation UpdateTask($id: ID!, $input: UpdateTaskInput!) {
    updateTask(id: $id, input: $input) {
      id title description status priority tags estimatedHours dueDate updatedAt
    }
  }
`;

export const MOVE_TASK = gql`
  mutation MoveTask($id: ID!, $status: String!) {
    moveTask(id: $id, status: $status) {
      id status position updatedAt
    }
  }
`;

export const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id)
  }
`;

export const GENERATE_TASKS = gql`
  mutation GenerateTasks($workspaceId: ID!, $prompt: String!) {
    generateTasks(workspaceId: $workspaceId, prompt: $prompt) {
      tokensUsed model promptSummary
      tasks { id title description priority status tags aiGenerated createdAt }
    }
  }
`;

export const TASK_UPDATED_SUBSCRIPTION = gql`
  subscription TaskUpdated($workspaceId: ID!) {
    taskUpdated(workspaceId: $workspaceId) {
      id title status priority position updatedAt
    }
  }
`;

// Notifications
export const GET_NOTIFICATIONS = gql`
  query GetNotifications($unreadOnly: Boolean) {
    notifications(unreadOnly: $unreadOnly) {
      id type title body isRead createdAt actionUrl
    }
  }
`;

export const MARK_READ = gql`
  mutation MarkRead($id: ID!) {
    markNotificationRead(id: $id) { id isRead }
  }
`;

// Admin
export const ADMIN_STATS = gql`
  query AdminStats {
    adminStats { totalUsers totalWorkspaces totalTasks totalAIRequests }
  }
`;
