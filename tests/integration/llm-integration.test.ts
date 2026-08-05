import { chatModel } from '@/lib/ai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { measureLatency } from '@/lib/services/performance-tracer';

describe('LangChain LLM Integration Tests (REAL API INTEROPERABILITY)', () => {
  // Use a longer timeout for real external model API calls
  jest.setTimeout(20000);

  it('should successfully invoke the underlying LangChain chatModel and receive valid string content', async () => {
    if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
      console.log('Skipping live LLM network test: No API keys configured in environment.');
      return;
    }

    const { result, durationMs } = await measureLatency('llm_live_invocation', async () => {
      const response = await chatModel.invoke([
        new SystemMessage('You are a helpful lab assistant. Keep responses under 20 words.'),
        new HumanMessage('What is Hemoglobin?'),
      ]);
      return response;
    });

    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(typeof result.content === 'string' ? result.content : JSON.stringify(result.content)).toContain('oxygen');
    expect(durationMs).toBeLessThan(15000);
  });
});
