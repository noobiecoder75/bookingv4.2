'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare, Send, Edit, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface ClientMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string, requestChanges: boolean) => void;
  agentName: string;
}

export function ClientMessageModal({ 
  isOpen, 
  onClose, 
  onSend, 
  agentName 
}: ClientMessageModalProps) {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'question' | 'changes'>('question');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      await onSend(message.trim(), messageType === 'changes');
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setMessageType('question');
    onClose();
  };

  const quickMessages = {
    question: [
      "I have some questions about the itinerary",
      "Can you provide more details about the accommodations?",
      "What's included in the activity pricing?",
      "Are there any additional fees I should know about?"
    ],
    changes: [
      "I'd like to modify the travel dates",
      "Can we look at different accommodation options?",
      "I'd prefer different flight times",
      "Can we add/remove some activities?"
    ]
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>Message {agentName}</span>
          </DialogTitle>
          <DialogDescription>
            Send a message to your travel agent about this quote
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Message Type Selection */}
          <div className="space-y-3">
            <Label>What would you like to do?</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMessageType('question')}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  messageType === 'question'
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <MessageSquare className="w-5 h-5 mb-2" />
                <div className="font-medium">Ask Questions</div>
                <div className="text-sm text-gray-600">
                  Get more information
                </div>
              </button>
              <button
                type="button"
                onClick={() => setMessageType('changes')}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  messageType === 'changes'
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Edit className="w-5 h-5 mb-2" />
                <div className="font-medium">Request Changes</div>
                <div className="text-sm text-gray-600">
                  Modify the quote
                </div>
              </button>
            </div>
          </div>

          {/* Quick Message Options */}
          <div className="space-y-3">
            <Label>Quick options:</Label>
            <div className="space-y-2">
              {quickMessages[messageType].map((quickMsg, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setMessage(quickMsg)}
                  className="w-full text-left text-sm p-3 border rounded-md hover:bg-gray-50 transition-colors"
                >
                  {quickMsg}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="message">
              Your Message {messageType === 'changes' && '(describe the changes you\'d like)'}
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                messageType === 'question'
                  ? "Type your question here..."
                  : "Describe the changes you'd like to make to this quote..."
              }
              rows={4}
              className="resize-none"
            />
            <div className="text-xs text-gray-500">
              {message.length}/500 characters
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!message.trim() || isLoading}
              className={
                messageType === 'changes'
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Sending...
                </div>
              ) : (
                <div className="flex items-center">
                  <Send className="w-4 h-4 mr-1" />
                  {messageType === 'changes' ? 'Request Changes' : 'Send Message'}
                </div>
              )}
            </Button>
          </div>

          {/* Note */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <div className="flex items-start space-x-2">
              <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Note:</strong> {agentName} will receive your message and respond within 24 hours. 
                {messageType === 'changes' && ' Requesting changes may affect the total cost and availability.'}
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}