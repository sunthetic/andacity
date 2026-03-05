export const paginationWindow = (page: number, total: number) => {
  const out: number[] = []
  const start = Math.max(1, page - 2)
  const end = Math.min(total, page + 2)
  for (let i = start; i <= end; i++) out.push(i)
  return out
}
