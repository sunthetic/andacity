import { cn } from "~/lib/cn"

export const Page = ({ class: className, children }: PageProps) => {
  return (
        <div class={cn("mx-auto max-w-6xl px-4 py-10", className)}>
          {children}
        </div>
  )
}

type PageProps = {
  class?: string
  children: any
}