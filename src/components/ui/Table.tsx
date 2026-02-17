import { HTMLAttributes } from 'react'
import View from '../base/View'
import Text from '../base/Text'

export interface Props extends HTMLAttributes<HTMLTableElement> {
  headers: string[]
}

const Table = ({ headers, children, className = '', ...rest }: Props) => {
  return (
    <View bg="fg" className={`rounded-base overflow-hidden shadow-custom ${className}`}>
      <table className="w-full" {...rest}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className="text-left px-4 py-3 border-b">
                <Text variant="sm" className="font-medium">
                  {h}
                </Text>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </View>
  )
}

export default Table
