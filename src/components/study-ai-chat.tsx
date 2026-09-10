"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState, useTransition } from "react";

import { sendStudyChatMessageAction } from "@/app/recommendation-actions";
import styles from "@/app/recomendacoes/recommendations.module.css";
import type {
  StudyChatHistoryMessage,
  StudyChatVideoDTO,
} from "@/types/study-recommendations";

type ChatMessage = StudyChatHistoryMessage & {
  id: string;
  error?: boolean;
  videos?: StudyChatVideoDTO[];
};

const QUICK_PROMPTS = [
  "Quais matérias precisam de mais atenção?",
  "Recomende videoaulas para eu estudar agora",
  "Como devo organizar meus estudos nesta semana?",
];

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="m4 4 16 8-16 8 3-8z" />
      <path d="M7 12h13" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="m12 3 1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3z" />
      <path d="m18 13 .8 2.2L21 16l-2.2.8L18 19l-.8-2.2L15 16l2.2-.8z" />
    </svg>
  );
}

function ChatVideo({ video }: { video: StudyChatVideoDTO }) {
  return (
    <a
      className={styles.chatVideo}
      href={video.videoUrl}
      rel="noreferrer"
      target="_blank"
    >
      <span className={styles.chatVideoThumbnail}>
        <Image alt="" fill sizes="(max-width: 640px) 42vw, 210px" src={video.thumbnailUrl} />
        <i aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="m9 7 8 5-8 5z" /></svg>
        </i>
      </span>
      <span className={styles.chatVideoBody}>
        <small>
          <i style={{ backgroundColor: video.subjectColor }} />
          {video.subjectName}
        </small>
        <strong>{video.videoTitle}</strong>
        <span>{video.channelTitle}</span>
        <p>{video.rationale}</p>
      </span>
    </a>
  );
}

export function StudyAiChat({
  classroomConnected,
  aiConsentGranted,
  openAIConfigured,
  youtubeConfigured,
}: {
  classroomConnected: boolean;
  aiConsentGranted: boolean;
  openAIConfigured: boolean;
  youtubeConfigured: boolean;
}) {
  const ready = classroomConnected && aiConsentGranted && openAIConfigured;
  const initialMessage = ready
    ? "Olá! Posso analisar suas notas e os assuntos publicados no Google Sala de Aula. Pergunte sobre prioridades, conteúdos ou peça videoaulas para estudar."
    : "Olá! Para conversarmos sobre seus estudos, conecte o Classroom e autorize o uso informado dos dados acadêmicos pela IA.";
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: initialMessage },
  ]);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const sequence = useRef(0);
  const conversationEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    conversationEnd.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, pending]);

  function nextId(role: ChatMessage["role"]) {
    sequence.current += 1;
    return `${role}-${sequence.current}`;
  }

  function sendMessage(rawMessage: string) {
    const message = rawMessage.trim();
    if (!message || !ready || pending) return;

    const history = messages
      .filter((item) => !item.error)
      .slice(-8)
      .map(({ role, content }) => ({ role, content }));
    setMessages((current) => [
      ...current,
      { id: nextId("user"), role: "user", content: message },
    ]);
    setInput("");

    startTransition(async () => {
      const result = await sendStudyChatMessageAction({ message, history });
      setMessages((current) => [
        ...current,
        {
          id: nextId("assistant"),
          role: "assistant",
          content: result.message,
          error: result.status === "error",
          videos: result.videos,
        },
      ]);
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(input);
  }

  return (
    <section className={styles.chatPanel} aria-labelledby="chat-title">
      <header className={styles.chatHeader}>
        <span className={styles.assistantAvatar}><SparkIcon /></span>
        <div>
          <h2 id="chat-title">Bate-papo com a IA</h2>
          <p>
            <i className={ready ? styles.onlineDot : styles.offlineDot} />
            {ready ? "Assistente acadêmico disponível" : "Aguardando conexão e autorização"}
          </p>
        </div>
        <span className={styles.contextBadge}>Notas + Classroom</span>
      </header>

      <div className={styles.chatMessages} aria-live="polite">
        {messages.map((message) => (
          <article
            className={`${styles.chatMessage} ${
              message.role === "user" ? styles.userMessage : styles.assistantMessage
            } ${message.error ? styles.errorMessage : ""}`}
            key={message.id}
          >
            {message.role === "assistant" ? (
              <span className={styles.messageAvatar}><SparkIcon /></span>
            ) : null}
            <div className={styles.messageContent}>
              <span>{message.role === "assistant" ? "AcadIA" : "Você"}</span>
              <p>{message.content}</p>
              {message.videos?.length ? (
                <div className={styles.chatVideos}>
                  {message.videos.map((video) => <ChatVideo key={video.id} video={video} />)}
                </div>
              ) : null}
            </div>
          </article>
        ))}

        {pending ? (
          <article className={`${styles.chatMessage} ${styles.assistantMessage}`}>
            <span className={styles.messageAvatar}><SparkIcon /></span>
            <div className={styles.typingIndicator} aria-label="A AcadIA está pensando">
              <i /><i /><i />
            </div>
          </article>
        ) : null}
        <div ref={conversationEnd} />
      </div>

      <div className={styles.quickPrompts} aria-label="Perguntas sugeridas">
        {QUICK_PROMPTS.map((prompt) => (
          <button disabled={!ready || pending} key={prompt} onClick={() => sendMessage(prompt)} type="button">
            {prompt}
          </button>
        ))}
      </div>

      <form className={styles.chatComposer} onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="study-chat-message">Mensagem para a AcadIA</label>
        <textarea
          disabled={!ready || pending}
          id="study-chat-message"
          maxLength={500}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              sendMessage(input);
            }
          }}
          placeholder={ready ? "Pergunte sobre suas notas ou peça uma videoaula…" : "Conclua a conexão e a autorização para começar"}
          rows={1}
          value={input}
        />
        <button aria-label="Enviar mensagem" disabled={!ready || pending || !input.trim()} type="submit">
          <SendIcon />
        </button>
      </form>
      <footer className={styles.chatFooter}>
        <span>A IA pode cometer erros. Confira informações acadêmicas importantes.</span>
        {!youtubeConfigured ? <strong>Conecte o YouTube para receber videoaulas.</strong> : null}
      </footer>
    </section>
  );
}
