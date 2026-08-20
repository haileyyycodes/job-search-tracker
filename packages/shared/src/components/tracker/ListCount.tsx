interface ListCountProps {
  shown: number;
  total: number;
  noun: string;
  nounPlural?: string;
}

/** Right-aligned list tally: "14 of 60 applications" while filters hide rows, plain "60 applications" otherwise. */
export function ListCount({ shown, total, noun, nounPlural = `${noun}s` }: ListCountProps) {
  const name = total === 1 ? noun : nounPlural;
  return (
    <span
      style={{
        marginLeft: "auto",
        alignSelf: "center",
        whiteSpace: "nowrap",
        font: "var(--text-body-s)",
        color: "var(--text-tertiary)",
      }}
    >
      {shown === total ? `${total} ${name}` : `${shown} of ${total} ${name}`}
    </span>
  );
}
