type MarkdownProps = {
  markdown: string;
};

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "code"; text: string };

export function SettingsMarkdown(props: MarkdownProps) {
  return (
    <div className="space-y-4 text-sm text-muted-foreground">
      {parseMarkdown(props.markdown).map((block, index) => renderBlock(block, index))}
    </div>
  );
}

function renderBlock(block: Block, index: number) {
  if (block.type === "heading") {
    const className = block.level <= 3 ? "text-base font-semibold text-foreground" : "text-sm font-semibold text-foreground";
    return <h3 key={index} className={className}>{block.text}</h3>;
  }
  if (block.type === "list") {
    return (
      <ol key={index} className="ml-5 list-decimal space-y-2">
        {block.items.map((item) => <li key={item}>{renderInline(item)}</li>)}
      </ol>
    );
  }
  if (block.type === "code") {
    return <pre key={index} className="overflow-x-auto rounded-md border bg-muted/50 p-3 text-xs text-foreground"><code>{block.text}</code></pre>;
  }
  return <p key={index} className="leading-6">{renderInline(block.text)}</p>;
}

function parseMarkdown(markdown: string): Block[] {
  const blocks: Block[] = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let paragraph: string[] = [];
  let list: string[] = [];
  let code: string[] | null = null;

  const flush = () => {
    if (paragraph.length) blocks.push({ type: "paragraph", text: paragraph.join(" ") });
    if (list.length) blocks.push({ type: "list", items: list });
    paragraph = [];
    list = [];
  };

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (code) {
        blocks.push({ type: "code", text: code.join("\n") });
        code = null;
      } else {
        flush();
        code = [];
      }
      continue;
    }
    if (code) {
      code.push(line);
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flush();
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
      continue;
    }

    const numbered = line.match(/^\d+\.\s+(.+)$/);
    if (numbered) {
      paragraph = [];
      list.push(numbered[1]);
      continue;
    }

    if (!line.trim()) {
      flush();
      continue;
    }
    if (list.length) flush();
    paragraph.push(line.trim());
  }
  flush();
  if (code) blocks.push({ type: "code", text: code.join("\n") });
  return blocks;
}

function renderInline(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index} className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">{part.slice(1, -1)}</code>;
    }
    return <span key={index}>{part}</span>;
  });
}
