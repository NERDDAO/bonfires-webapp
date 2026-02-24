import {
  ChatProvider,
  ChatProviderProps,
  useChat,
} from "@/app/(main)/(graph)/graph/_contexts/chat-context";
import ChatPanel from "@/app/(main)/(graph)/graph/_components/chat/chat-panel";
import { Button } from "@/components/ui/button";

function ChatInner() {
  const { mode, toggleChat } = useChat();
  return (
    <>
      <ChatPanel />

      {mode === "none" && (
        <Button
          variant="primary"
          onClick={toggleChat}
          className="fixed bottom-4 right-4 z-30 hidden lg:flex"
          aria-label="Open chat"
          leftIcon="/icons/chat.svg"
        >
          Chat with the graph
        </Button>
      )}
    </>
  );
}

export default function Chat({
  agentId,
  agentName,
  bonfireId,
  getGraphContext,
  onReady,
}: Omit<ChatProviderProps, "children">) {
  return (
    <ChatProvider
      agentId={agentId}
      agentName={agentName}
      bonfireId={bonfireId}
      getGraphContext={getGraphContext}
      onReady={onReady}
    >
      <ChatInner />
    </ChatProvider>
  );
}
