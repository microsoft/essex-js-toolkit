/*!
 * Copyright (c) Microsoft. All rights reserved.
 * Licensed under the MIT license. See LICENSE file in the project.
 */
import { TextField, Dropdown, ChoiceGroup } from '@fluentui/react'
import * as React from 'react'
import { useCallback } from 'react'
import { ControlType, ControlProps } from './interfaces'

/**
 * TextControl creates either thematic themed TextField, Dropdown, or ChoiceGroup
 * as a Fluent component based on config options
 */
export const TextControl = ({
	config,
	onChange,
}: ControlProps): JSX.Element => {
	const { key, value, type, label, control, params } = config
	const handleTextChange = useCallback(
		(evt, text) => {
			onChange && onChange(key, text)
		},
		[key, onChange],
	)
	const handleOptionChange = useCallback(
		(evt, option) => {
			onChange && onChange(key, option.text)
		},
		[key, onChange],
	)
	switch (control) {
		case ControlType.textbox:
			return (
				<TextField
					key={`textfield-${key}`}
					label={label}
					value={value}
					onChange={handleTextChange}
				/>
			)
		case ControlType.dropdown:
			if (!params || !params?.options) {
				throw new Error('Dropdown control type requires list of options')
			}
			return (
				<Dropdown
					key={`dropdown-${key}`}
					label={label}
					options={params.options.map(opt => ({
						key: opt,
						text: opt,
						selected: opt === value,
					}))}
					onChange={handleOptionChange}
				/>
			)
		case ControlType.radio:
			if (!params || !params?.options) {
				throw new Error('Radio control type requires list of options')
			}
			return (
				<ChoiceGroup
					key={`radio-${key}`}
					label={label}
					selectedKey={value}
					options={params?.options.map(opt => ({
						key: opt,
						text: opt,
					}))}
					onChange={handleOptionChange}
				/>
			)
		default:
			throw new Error(`Unsupported control type ${control} for ${type}`)
	}
}
