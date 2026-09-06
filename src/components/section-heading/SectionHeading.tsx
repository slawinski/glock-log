import { TerminalText } from "../terminal-text/TerminalText";

type Props = {
  title: string;
  className?: string;
};

export const SectionHeading = ({ title, className = "" }: Props) => (
  <TerminalText
    className={`uppercase border-b-2 border-terminal-border pb-1 mb-3 px-1 ${className}`}
  >
    {title}
  </TerminalText>
);
