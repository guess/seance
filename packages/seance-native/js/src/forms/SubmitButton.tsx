import { useContext } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { FormContext } from './Form';
import { observer } from 'mobx-react-lite';

type SubmitButtonProps = {
  title?: string;
};

export const SubmitButton = observer(
  ({ title = 'Submit' }: SubmitButtonProps) => {
    const formStore = useContext(FormContext);
    if (!formStore) throw new Error('SubmitButton must be used within a Form');

    return (
      <TouchableOpacity
        style={[
          styles.submitButton,
          !formStore.isValid && styles.submitButtonDisabled,
        ]}
        onPress={() => formStore.submitForm()}
        disabled={!formStore.isValid}
      >
        <Text style={styles.submitButtonText}>{title}</Text>
      </TouchableOpacity>
    );
  }
);

const styles = StyleSheet.create({
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#A0CFFF',
  },
  submitButtonText: {
    color: 'white',

    fontSize: 16,
  },
});
