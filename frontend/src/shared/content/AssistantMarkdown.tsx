/** Render assistant prose as React elements without model-defined navigation or HTML. */
import { Fragment, useMemo, type ReactNode } from "react";
import { lexer, type MarkedToken, type Token, type Tokens } from "marked";
import "./assistant-markdown.css";

function renderTokens(tokens: Token[]): ReactNode {
  // The lexer uses its built-in grammar and no token extensions.
  return tokens.map((token, index) => (
    <Fragment key={index}>{renderToken(token as MarkedToken)}</Fragment>
  ));
}

function renderTable({ header, rows }: Tokens.Table) {
  return (
    <div className="assistant-markdown-table" tabIndex={0}>
      <table>
        <thead>
          <tr>
            {header.map((cell, index) => (
              <th key={index} scope="col">
                {renderTokens(cell.tokens)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, column) => (
                <td key={column}>{renderTokens(cell.tokens)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderToken(token: MarkedToken): ReactNode {
  switch (token.type) {
    case "paragraph":
      return <p>{renderTokens(token.tokens)}</p>;
    case "heading":
      return (
        <p>
          <strong>{renderTokens(token.tokens)}</strong>
        </p>
      );
    case "strong":
      return <strong>{renderTokens(token.tokens)}</strong>;
    case "em":
      return <em>{renderTokens(token.tokens)}</em>;
    case "del":
      return <del>{renderTokens(token.tokens)}</del>;
    case "codespan":
      return <code>{token.text}</code>;
    case "code":
      return (
        <pre>
          <code>{token.text}</code>
        </pre>
      );
    case "blockquote":
      return <blockquote>{renderTokens(token.tokens)}</blockquote>;
    case "list": {
      const items = token.items.map((item, index) => (
        <li key={index}>{renderTokens(item.tokens)}</li>
      ));
      return token.ordered ? (
        <ol start={Number(token.start)}>{items}</ol>
      ) : (
        <ul>{items}</ul>
      );
    }
    case "table":
      return renderTable(token);
    case "br":
      return <br />;
    case "hr":
      return <hr />;
    case "space":
    case "def":
      return null;
    case "checkbox":
      return token.raw;
    case "link":
    case "image":
      return renderTokens(token.tokens);
    case "text":
      return token.tokens ? renderTokens(token.tokens) : token.text;
    case "escape":
    case "html":
    case "list_item":
      return token.text;
  }
}

export default function AssistantMarkdown({ text }: { text: string }) {
  const tokens = useMemo(
    () => lexer(text, { gfm: true, breaks: true }),
    [text],
  );
  return <div className="assistant-markdown">{renderTokens(tokens)}</div>;
}
