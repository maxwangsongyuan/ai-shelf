export function SourceLink({ title, url }: { title: string; url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="text-blue-400 hover:text-blue-300 text-sm underline underline-offset-2 truncate block max-w-md">
      {title || url}
    </a>
  );
}
