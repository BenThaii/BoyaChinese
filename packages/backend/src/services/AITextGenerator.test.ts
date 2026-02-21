import { AITextGenerator } from './AITextGenerator';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock the Google Generative AI module
jest.mock('@google/generative-ai');

describe('AITextGenerator', () => {
  let service: AITextGenerator;
  let mockModel: any;
  let mockGenAI: any;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mock model instance
    mockModel = {
      generateContent: jest.fn()
    };

    // Create mock GenAI instance
    mockGenAI = {
      getGenerativeModel: jest.fn().mockReturnValue(mockModel)
    };

    // Mock the GoogleGenerativeAI constructor
    (GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>).mockImplementation(() => mockGenAI);

    // Create service instance
    service = new AITextGenerator();
  });

  describe('generateText', () => {
    it('should generate Chinese text from character list', async () => {
      const characters = ['你', '好', '我', '是', '学', '生'];
      const generatedText = '你好我是学生';
      
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => generatedText
        }
      });

      const result = await service.generateText(characters, 40);

      expect(result.chineseText).toBe(generatedText);
      expect(result.wordCount).toBe(6);
      expect(result.pinyin).toBe(''); // Pinyin not implemented yet
      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('你好我是学生')
      );
    });

    it('should enforce 40-word maximum limit by default', async () => {
      const characters = ['你', '好', '我', '是'];
      const generatedText = '你好';
      
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => generatedText
        }
      });

      const result = await service.generateText(characters);

      expect(result.wordCount).toBeLessThanOrEqual(40);
      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('Maximum 40 words')
      );
    });

    it('should accept custom maxWords parameter', async () => {
      const characters = ['你', '好', '我'];
      const generatedText = '你好';
      
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => generatedText
        }
      });

      const result = await service.generateText(characters, 20);

      expect(result.wordCount).toBeLessThanOrEqual(20);
      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('Maximum 20 words')
      );
    });

    it('should handle up to 300 input characters', async () => {
      const characters = Array(300).fill('你');
      const generatedText = '你好世界';
      
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => generatedText
        }
      });

      const result = await service.generateText(characters, 40);

      expect(result.chineseText).toBe(generatedText);
      expect(mockModel.generateContent).toHaveBeenCalled();
    });

    it('should reject more than 300 input characters', async () => {
      const characters = Array(301).fill('你');

      await expect(service.generateText(characters, 40))
        .rejects
        .toThrow('Characters array exceeds maximum limit of 300');

      expect(mockModel.generateContent).not.toHaveBeenCalled();
    });

    it('should reject empty character array', async () => {
      const characters: string[] = [];

      await expect(service.generateText(characters, 40))
        .rejects
        .toThrow('Characters array cannot be empty');

      expect(mockModel.generateContent).not.toHaveBeenCalled();
    });

    it('should reject invalid maxWords (zero)', async () => {
      const characters = ['你', '好'];

      await expect(service.generateText(characters, 0))
        .rejects
        .toThrow('maxWords must be between 1 and 40');
    });

    it('should reject invalid maxWords (negative)', async () => {
      const characters = ['你', '好'];

      await expect(service.generateText(characters, -5))
        .rejects
        .toThrow('maxWords must be between 1 and 40');
    });

    it('should reject invalid maxWords (over 40)', async () => {
      const characters = ['你', '好'];

      await expect(service.generateText(characters, 41))
        .rejects
        .toThrow('maxWords must be between 1 and 40');
    });

    it('should handle duplicate characters by creating unique list', async () => {
      const characters = ['你', '好', '你', '好', '我'];
      const generatedText = '你好我';
      
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => generatedText
        }
      });

      const result = await service.generateText(characters, 40);

      expect(result.chineseText).toBe(generatedText);
      // Prompt should contain unique characters only
      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('你好我')
      );
    });

    it('should truncate text if generated text exceeds maxWords', async () => {
      const characters = ['你', '好', '世', '界', '我', '是', '学', '生'];
      const longText = '你好世界我是学生今天天气很好';
      
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => longText
        }
      });

      const result = await service.generateText(characters, 5);

      expect(result.wordCount).toBeLessThanOrEqual(5);
      expect(result.chineseText.length).toBeLessThanOrEqual(longText.length);
    });

    it('should handle text with punctuation correctly', async () => {
      const characters = ['你', '好', '吗', '？'];
      const generatedText = '你好吗？';
      
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => generatedText
        }
      });

      const result = await service.generateText(characters, 40);

      expect(result.chineseText).toBe(generatedText);
      // Word count should not include punctuation
      expect(result.wordCount).toBe(3); // 你好吗 (excluding ？)
    });

    it('should handle text with whitespace correctly', async () => {
      const characters = ['你', '好', '世', '界'];
      const generatedText = '你好 世界';
      
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => generatedText
        }
      });

      const result = await service.generateText(characters, 40);

      expect(result.chineseText).toBe(generatedText);
      // Word count should not include whitespace
      expect(result.wordCount).toBe(4);
    });

    it('should handle API errors gracefully', async () => {
      const characters = ['你', '好'];
      const errorMessage = 'API quota exceeded';
      
      mockModel.generateContent.mockRejectedValue(new Error(errorMessage));

      await expect(service.generateText(characters, 40))
        .rejects
        .toThrow(`Failed to generate text: ${errorMessage}`);
    });

    it('should handle non-Error exceptions', async () => {
      const characters = ['你', '好'];
      
      mockModel.generateContent.mockRejectedValue('Unknown error');

      await expect(service.generateText(characters, 40))
        .rejects
        .toThrow('Failed to generate text: Unknown error');
    });

    it('should handle empty generated text', async () => {
      const characters = ['你', '好'];
      
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => '   '
        }
      });

      await expect(service.generateText(characters, 40))
        .rejects
        .toThrow('Generated text is empty');
    });

    it('should trim whitespace from generated text', async () => {
      const characters = ['你', '好'];
      const generatedText = '  你好  ';
      
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => generatedText
        }
      });

      const result = await service.generateText(characters, 40);

      expect(result.chineseText).toBe('你好');
    });
  });

  describe('Edge cases', () => {
    it('should handle single character input', async () => {
      const characters = ['你'];
      const generatedText = '你';
      
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => generatedText
        }
      });

      const result = await service.generateText(characters, 40);

      expect(result.chineseText).toBe(generatedText);
      expect(result.wordCount).toBe(1);
    });

    it('should handle maxWords of 1', async () => {
      const characters = ['你', '好'];
      const generatedText = '你好';
      
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => generatedText
        }
      });

      const result = await service.generateText(characters, 1);

      expect(result.wordCount).toBeLessThanOrEqual(1);
    });

    it('should handle complex Chinese punctuation', async () => {
      const characters = ['你', '好', '吗'];
      const generatedText = '你好吗？！。，';
      
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => generatedText
        }
      });

      const result = await service.generateText(characters, 40);

      expect(result.chineseText).toBe(generatedText);
      // Should only count actual characters, not punctuation
      expect(result.wordCount).toBe(3);
    });

    it('should handle mixed traditional and simplified characters', async () => {
      const characters = ['你', '好', '學', '生'];
      const generatedText = '你好學生';
      
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => generatedText
        }
      });

      const result = await service.generateText(characters, 40);

      expect(result.chineseText).toBe(generatedText);
      expect(result.wordCount).toBe(4);
    });
  });
});
