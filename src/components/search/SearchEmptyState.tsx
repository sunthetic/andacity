import { component$ } from '@builder.io/qwik'
import { ResultsEmpty } from '~/components/results/ResultsEmpty'

export type SearchEmptyStateProps = {
  title: string
  description: string
  primaryAction: {
    label: string
    href: string
  }
  secondaryAction?: {
    label: string
    href: string
  }
}

export const SearchEmptyState = component$((props: SearchEmptyStateProps) => {
  return (
    <ResultsEmpty
      title={props.title}
      description={props.description}
      primaryAction={props.primaryAction}
      secondaryAction={props.secondaryAction}
    />
  )
})
