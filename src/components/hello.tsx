import React from 'react'

export interface HelloWorldProps {}

export const HelloWorld = ({}: HelloWorldProps) => {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>Hello, World!</h1>
      <p>This is a very simple React component.</p>
    </div>
  )
}
