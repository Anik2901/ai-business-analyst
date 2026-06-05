export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: number
  // When set, the chat renders a compact file chip instead of the raw content
  // (used for uploaded notes — the full text still goes to the model via content).
  attachment?: { name: string }
}

export type DocumentStatus = 'idle' | 'generating' | 'complete' | 'error'

export interface BRDDocument {
  executiveSummary: string
  businessObjectives: string
  stakeholderMap: string
  scope: string
  successKPIs: string
  constraintsAssumptions: string
}

export interface FRDDocument {
  featureModules: string
  inputOutputSpecs: string
  validationRules: string
  businessLogic: string
  apiContracts: string
  databaseRequirements: string
}

export interface NFRDocument {
  performance: string
  security: string
  scalability: string
  availability: string
  compliance: string
  accessibility: string
}

export interface RequirementsOutput {
  brd: BRDDocument
  frd: FRDDocument
  nfr: NFRDocument
}

export interface UserStory {
  id: string
  role: string
  action: string
  benefit: string
  acceptanceCriteria: string[]
  priority: 'Must' | 'Should' | 'Could' | "Won't"
  storyPoints: number
}

export interface Epic {
  name: string
  description: string
  stories: UserStory[]
}

export interface UserStoriesOutput {
  epics: Epic[]
}

export interface ArchitectureOutput {
  techStack: string
  architectureDiagram: string
  dbSchema: string
  description: string
}

export interface FlowDiagramsOutput {
  userJourney: string
  apiSequence: string
  dataFlow: string
  descriptions: {
    userJourney: string
    apiSequence: string
    dataFlow: string
  }
}

export interface RiskAnalysisOutput {
  riskMatrix: string
  mvpScope: string
  effortEstimates: string
  roadmap: string
  dependencies: string
}

export type DocumentType = 'brd' | 'frd' | 'nfr' | 'stories' | 'architecture' | 'flows' | 'risk'

export type DocumentData = BRDDocument | FRDDocument | NFRDocument | UserStoriesOutput | ArchitectureOutput | FlowDiagramsOutput | RiskAnalysisOutput

export interface DocumentTabState {
  type: DocumentType
  label: string
  status: DocumentStatus
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: DocumentData | any | null
  error: string | null
}

export interface GenerationState {
  isGenerating: boolean
  currentStep: number
  totalSteps: number
  tabs: DocumentTabState[]
}

export interface AppState {
  phase: 'chat' | 'generating' | 'complete'
  chatMessages: ChatMessage[]
  generation: GenerationState
  activeTab: DocumentType
}

export interface SavedSession {
  id: string
  name: string
  timestamp: number
  messages: ChatMessage[]
  generation: GenerationState
  outputs: Record<string, string>
  chatContext: string
}
