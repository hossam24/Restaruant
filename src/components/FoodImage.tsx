import { useState, type ImgHTMLAttributes } from 'react'
import { DEFAULT_IMAGE } from '../data/sheetMenu'

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError'> & { src: string }

export function FoodImage({ src, alt, ...rest }: Props) {
  const [failed, setFailed] = useState<string | null>(null)
  const shown = failed === src ? DEFAULT_IMAGE : src
  return <img {...rest} src={shown} alt={alt} onError={() => src !== DEFAULT_IMAGE && setFailed(src)} />
}
