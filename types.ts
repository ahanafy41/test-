export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  time: number;
}

export interface ApiError {
  message: string;
}

export interface WebCitation {
    uri: string;
    title: string;
}

export interface GroundingChunk {
    web: WebCitation;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  citations?: GroundingChunk[];
}

// Type for files from GitHub API
export interface GitHubFile {
  path: string;
  type: 'blob' | 'tree';
  sha: string;
}

export interface RepoInfo {
    path: string;
    defaultBranch: string;
}

export interface FoundApi {
  name: string;
  description: string;
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: string;
  usage_explanation: string;
  test_in_app_example: string;
}

export interface AgentAction {
  action_type: 'CREATE_FILE' | 'UPDATE_FILE' | 'DELETE_FILE' | 'DELETE_FOLDER' | 'MOVE_FILE' | 'MOVE_FOLDER' | 'COPY_FILE' | 'COPY_FOLDER';
  file_path?: string; // for CREATE, UPDATE, DELETE_FILE
  folder_path?: string; // for DELETE_FOLDER
  source_path?: string; // for MOVE, COPY
  destination_path?: string; // for MOVE, COPY
  content?: string; // for CREATE, UPDATE
  explanation: string;
}