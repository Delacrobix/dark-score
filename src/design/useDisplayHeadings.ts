import { useDesignOption } from './useDesignOption'

/** Heading classes for the 'headings' option: a book serif ('grabado') or the previous system sans. */
export function useDisplayHeadings() {
  const serif = useDesignOption('headings') === 'grabado'
  return {
    h1: serif
      ? 'font-display text-[2.6rem] md:text-[3.6rem] font-medium leading-[1.04] tracking-[-0.018em] text-balance'
      : 'text-4xl md:text-5xl font-bold tracking-tight leading-tight',
    h2: serif ? 'font-display text-[1.85rem] font-medium tracking-[-0.01em]' : 'text-2xl font-semibold',
    /** About page: smaller title, section headings in the accent colour */
    pageTitle: serif ? 'font-display text-[2.4rem] font-medium tracking-[-0.015em]' : 'text-3xl font-bold',
    section: serif ? 'font-display text-[1.6rem] font-medium tracking-[-0.01em]' : 'text-xl font-semibold',
  }
}
