export const integrationKeyNames = [
  'agenticaApiKey',
  'agenticaDeepCoderApiKey',
  'codeRabbitApi',
  'cognitiveComputationsDolphinMistralApiKey',
  'elevenLabsApiKey',
  'geminiApiKey',
  'githubApiKey',
  'glm45ApiKey',
  'grokXApiKey',
  'hermesLlamaApiKey',
  'kimiDevMoonshotApiKey',
  'microsoftAiCoderApiKey',
  'minimaxApiKey',
  'mistralAiApiKey',
  'mistralAiDevStrallApiKey',
  'nvidiaNematronNanoApiKey',
  'qwen25Coder32InstructApiKey',
  'qwenApiKey',
  'qwen3CoderApiKey',
  'tngTechDeepSeekApiKey',
  'xApiKey'
] as const;

export type IntegrationKeyName = (typeof integrationKeyNames)[number];

export const INTEGRATION_KEY_MAX_LENGTH = 1024;

type IntegrationKeyDefinition = {
  name: IntegrationKeyName;
  label: string;
  description?: string;
  placeholder?: string;
};

export const integrationKeyDefinitions: ReadonlyArray<IntegrationKeyDefinition> = [
  {
    name: 'agenticaApiKey',
    label: 'Agentica API Key',
    description: 'Primary token for the Agentica unified automation fabric.',
    placeholder: 'agentica_sk_live_***'
  },
  {
    name: 'agenticaDeepCoderApiKey',
    label: 'Agentica Deep Coder API Key',
    description: 'Enables autonomous code generation via Agentica DeepCoder.',
    placeholder: 'deepcoder_sk_live_***'
  },
  {
    name: 'codeRabbitApi',
    label: 'CodeRabbit API Key',
    description: 'Required for CodeRabbit pull request reviews and annotations.',
    placeholder: 'coderabbit_sk_live_***'
  },
  {
    name: 'cognitiveComputationsDolphinMistralApiKey',
    label: 'Cognitive Computations Dolphin Mistral',
    description: 'Connects to the Dolphin-Mistral reasoning endpoint.',
    placeholder: 'dolphin_sk_live_***'
  },
  {
    name: 'elevenLabsApiKey',
    label: 'ElevenLabs API Key',
    description: 'Used for ElevenLabs audio and voice synthesis tasks.',
    placeholder: 'elevenlabs_sk_live_***'
  },
  {
    name: 'geminiApiKey',
    label: 'Gemini API Key',
    description: 'Google Gemini access for multimodal reasoning.',
    placeholder: 'AIzSy...'
  },
  {
    name: 'githubApiKey',
    label: 'GitHub API Key',
    description: 'Needed for repository syncing and GitHub Apps automation.',
    placeholder: 'ghp_***'
  },
  {
    name: 'glm45ApiKey',
    label: 'GLM 4.5 API Key',
    description: 'Connects to GLM 4.5 large language models.',
    placeholder: 'glm45_sk_live_***'
  },
  {
    name: 'grokXApiKey',
    label: 'Grok X API Key',
    description: 'Enables Grok X conversational intelligence.',
    placeholder: 'grokx_sk_live_***'
  },
  {
    name: 'hermesLlamaApiKey',
    label: 'Hermes Llama API Key',
    description: 'Unlocks Hermes fine-tuned Llama endpoints.',
    placeholder: 'hermes_sk_live_***'
  },
  {
    name: 'kimiDevMoonshotApiKey',
    label: 'Kimi Dev Moonshot API Key',
    description: 'Required for Kimi/Moonshot bilingual assistants.',
    placeholder: 'moonshot_sk_live_***'
  },
  {
    name: 'microsoftAiCoderApiKey',
    label: 'Microsoft AI Coder API Key',
    description: 'Needed for Microsoft-hosted Copilot/Coder endpoints.',
    placeholder: 'microsoft_coder_sk_live_***'
  },
  {
    name: 'minimaxApiKey',
    label: 'Minimax API Key',
    description: 'Connects to Minimax text and speech capabilities.',
    placeholder: 'minimax_sk_live_***'
  },
  {
    name: 'mistralAiApiKey',
    label: 'Mistral AI API Key',
    description: 'Standard Mistral API access token.',
    placeholder: 'mistral_sk_live_***'
  },
  {
    name: 'mistralAiDevStrallApiKey',
    label: 'Mistral AI Dev (Strall) API Key',
    description: 'Used for developer preview Strall endpoints.',
    placeholder: 'mistral_dev_sk_live_***'
  },
  {
    name: 'nvidiaNematronNanoApiKey',
    label: 'NVIDIA Nematron Nano API Key',
    description: 'Provides access to NVIDIA’s Nematron Nano agents.',
    placeholder: 'nvidia_nematron_sk_live_***'
  },
  {
    name: 'qwen25Coder32InstructApiKey',
    label: 'Qwen 2.5 Coder 32-Instruct API Key',
    description: 'Alibaba Qwen 2.5 coder-specific credentials.',
    placeholder: 'qwen25_sk_live_***'
  },
  {
    name: 'qwenApiKey',
    label: 'Qwen API Key',
    description: 'General-purpose Qwen access token.',
    placeholder: 'qwen_sk_live_***'
  },
  {
    name: 'qwen3CoderApiKey',
    label: 'Qwen 3 Coder API Key',
    description: 'Latest-generation Qwen coder key.',
    placeholder: 'qwen3_sk_live_***'
  },
  {
    name: 'tngTechDeepSeekApiKey',
    label: 'TNG Tech DeepSeek API Key',
    description: 'Used for DeepSeek reasoning services.',
    placeholder: 'deepseek_sk_live_***'
  },
  {
    name: 'xApiKey',
    label: 'X API Key',
    description: 'Required for integrating X (Twitter) streams & firehose.',
    placeholder: 'x_api_key_***'
  }
];
