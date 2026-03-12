"use client";

import { useState } from 'react';
import AIAssistant from './AIAssistant';

export default function AIAssistantClient() {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  return (
    <AIAssistant isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
  );
}
