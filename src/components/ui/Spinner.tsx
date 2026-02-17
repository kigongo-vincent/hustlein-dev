import View from '../base/View'

export interface Props {
  size?: 'sm' | 'md'
}

const Spinner = ({ size = 'md' }: Props) => {
  const dim = size === 'sm' ? 'w-4 h-4' : 'w-8 h-8'
  return (
    <View bg="fg" className={`rounded-base animate-spin ${dim} border-2 border-t-transparent`} />
  )
}

export default Spinner
