/**
 * Utilities for parsing and processing tool mentions in chat messages
 */

export interface ParsedMention {
  id: string;
  display: string;
  type: 'configured_mcp' | 'custom_mcp' | 'composio_mcp';
  status?: 'connected_to_agent' | 'connected_to_account' | 'available_to_connect';
  originalText: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Regular expression to match tool mentions in the format @[DisplayName](toolId)
 */
const MENTION_REGEX = /@\[([^\]]+)\]\(([^)]+)\)/g;

/**
 * Parse tool mentions from a message string
 * @param message The message containing potential tool mentions
 * @returns Array of parsed mentions
 */
export function parseToolMentions(message: string): ParsedMention[] {
  const mentions: ParsedMention[] = [];
  let match;

  // Reset regex lastIndex to ensure we start from the beginning
  MENTION_REGEX.lastIndex = 0;

  while ((match = MENTION_REGEX.exec(message)) !== null) {
    const [originalText, display, id] = match;
    const startIndex = match.index;
    const endIndex = match.index + originalText.length;

    // Determine tool type from ID
    let type: 'configured_mcp' | 'custom_mcp' | 'composio_mcp' = 'custom_mcp';
    if (id.startsWith('configured_mcp_') || id.startsWith('default_configured_mcp_')) {
      type = 'configured_mcp';
    } else if (id.startsWith('custom_mcp_') || id.startsWith('default_custom_mcp_')) {
      type = 'custom_mcp';
    } else if (id.includes('composio') || id.startsWith('available_composio_')) {
      type = 'composio_mcp';
    }

    mentions.push({
      id,
      display,
      type,
      originalText,
      startIndex,
      endIndex,
    });
  }

  return mentions;
}

/**
 * Convert a message with tool mentions to a format with structured instructions
 * NOTE: This function is deprecated for backend communication. The backend now
 * handles tool mention parsing directly from the original @[DisplayName](toolId) format.
 * This function may still be used for display or legacy purposes.
 * @param message The original message with mentions
 * @returns Object containing the processed message and mentioned tools
 */
export function processToolMentions(message: string): {
  processedMessage: string;
  mentionedTools: ParsedMention[];
  hasToolMentions: boolean;
} {
  const mentions = parseToolMentions(message);

  if (mentions.length === 0) {
    return {
      processedMessage: message,
      mentionedTools: [],
      hasToolMentions: false,
    };
  }

  // Sort mentions by start index in reverse order to replace from end to beginning
  // This prevents index shifting issues when replacing text
  const sortedMentions = [...mentions].sort((a, b) => b.startIndex - a.startIndex);

  let processedMessage = message;

  // Replace each mention with a structured instruction
  for (const mention of sortedMentions) {
    const toolInstruction = createToolInstruction(mention);
    processedMessage =
      processedMessage.slice(0, mention.startIndex) +
      toolInstruction +
      processedMessage.slice(mention.endIndex);
  }

  return {
    processedMessage,
    mentionedTools: mentions,
    hasToolMentions: true,
  };
}

/**
 * Create a structured instruction for the AI based on a tool mention
 * @param mention The parsed mention
 * @returns A string instruction for the AI
 */
function createToolInstruction(mention: ParsedMention): string {
  const toolName = mention.display;
  const toolType = mention.type;

  switch (toolType) {
    case 'configured_mcp':
      return `[USER MENTIONED TOOL: ${toolName} - Please prioritize using this MCP server when relevant to the user's request]`;
    case 'custom_mcp':
      return `[USER MENTIONED TOOL: ${toolName} - Please prioritize using this custom MCP server when relevant to the user's request]`;
    case 'composio_mcp':
      return `[USER MENTIONED TOOL: ${toolName} - Please prioritize using this Composio integration when relevant to the user's request]`;
    default:
      return `[USER MENTIONED TOOL: ${toolName} - Please use this tool when relevant to the user's request]`;
  }
}

/**
 * Extract plain text from a message with mentions (removes mention markup)
 * @param message The message with mention markup
 * @returns Plain text version of the message
 */
export function extractPlainText(message: string): string {
  return message.replace(MENTION_REGEX, '@$1');
}

/**
 * Check if a message contains any tool mentions
 * @param message The message to check
 * @returns True if the message contains tool mentions
 */
export function hasToolMentions(message: string): boolean {
  MENTION_REGEX.lastIndex = 0;
  return MENTION_REGEX.test(message);
}

/**
 * Get a summary of mentioned tools for display purposes
 * @param mentions Array of parsed mentions
 * @returns A formatted string summarizing the mentioned tools
 */
export function getMentionsSummary(mentions: ParsedMention[]): string {
  if (mentions.length === 0) return '';

  if (mentions.length === 1) {
    return `Mentioned: ${mentions[0].display}`;
  }

  if (mentions.length === 2) {
    return `Mentioned: ${mentions[0].display} and ${mentions[1].display}`;
  }

  const firstTwo = mentions.slice(0, 2).map(m => m.display).join(', ');
  const remaining = mentions.length - 2;
  return `Mentioned: ${firstTwo} and ${remaining} other${remaining > 1 ? 's' : ''}`;
}

/**
 * Validate that mentioned tools are actually available for the current agent
 * @param mentions Array of parsed mentions
 * @param availableToolIds Array of available tool IDs for the current agent
 * @returns Object with valid and invalid mentions
 */
export function validateMentions(
  mentions: ParsedMention[],
  availableToolIds: string[]
): {
  validMentions: ParsedMention[];
  invalidMentions: ParsedMention[];
} {
  const validMentions: ParsedMention[] = [];
  const invalidMentions: ParsedMention[] = [];

  for (const mention of mentions) {
    if (availableToolIds.includes(mention.id)) {
      validMentions.push(mention);
    } else {
      invalidMentions.push(mention);
    }
  }

  return { validMentions, invalidMentions };
}
