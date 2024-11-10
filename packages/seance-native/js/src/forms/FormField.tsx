import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import { snakeToTitleCase } from '../utils/snakeToTitleCase';

export type FormFieldSpec = {
  name: string;
  getValue: () => any;
  setValue: (value: any) => void;
  getErrors: () => string[];
};

export const displayName = (field: FormFieldSpec) =>
  snakeToTitleCase(field.name);

export type FormFieldProps = {
  field: FormFieldSpec;
  label?: string;
  children: (
    value: any,
    onChange: (value: any) => void,
    errors: string[] | undefined
  ) => ReactNode;
  renderLabel?: (label: string) => ReactNode;
  renderError?: (error: string, index: number) => ReactNode;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  labelContainerStyle?: ViewStyle;
  inputContainerStyle?: ViewStyle;
  errorContainerStyle?: ViewStyle;
};

export const FormField = ({
  field,
  label,
  children,
  renderLabel,
  renderError,
  containerStyle,
  labelStyle,
  errorStyle,
  labelContainerStyle,
  inputContainerStyle,
  errorContainerStyle,
}: FormFieldProps) => {
  const labelRenderer =
    renderLabel ||
    ((formLabel: string) => (
      <FormFieldLabel style={labelStyle}>{formLabel}</FormFieldLabel>
    ));

  const errorRenderer =
    renderError ||
    ((formError: string, index: number) => (
      <FormFieldError key={index} style={errorStyle}>
        {formError}
      </FormFieldError>
    ));

  const formLabel = label !== undefined ? label : displayName(field);

  return (
    <View style={[styles.fieldContainer, containerStyle]}>
      {label && (
        <View style={[styles.labelContainer, labelContainerStyle]}>
          {labelRenderer(formLabel)}
        </View>
      )}
      <View style={[styles.inputContainer, inputContainerStyle]}>
        {children(field.getValue(), field.setValue, field.getErrors())}
      </View>
      <View style={[styles.errorContainer, errorContainerStyle]}>
        {field.getErrors()?.map((error, index) => errorRenderer(error, index))}
      </View>
    </View>
  );
};

const FormFieldLabel = ({
  style,
  children,
}: {
  style?: TextStyle;
  children: ReactNode;
}) => {
  return <Text style={[styles.label, style]}>{children}</Text>;
};

const FormFieldError = ({
  style,
  children,
}: {
  style?: TextStyle;
  children: ReactNode;
}) => {
  return <Text style={[styles.error, style]}>{children}</Text>;
};

const styles = StyleSheet.create({
  fieldContainer: {
    flex: 1,
    flexDirection: 'column',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  error: {
    color: 'red',
    fontSize: 14,
    marginTop: 5,
  },
  labelContainer: {
    zIndex: 0,
  },
  inputContainer: {
    zIndex: 10,
  },
  errorContainer: {
    zIndex: 0,
  },
});
