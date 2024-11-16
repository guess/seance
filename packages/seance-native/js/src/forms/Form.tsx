import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { FormStore } from './FormStore';
import { View } from 'react-native';
import { BehaviorSubject, debounceTime, map } from 'rxjs';
import { LiveChannelStatus, type LiveChannelConnectEvent } from '@qult/seance';
import { useLiveView } from '../phoenix/LiveView';

export type FormData = { [key: string]: any };
export type FormErrors = { [key: string]: string[] | FormErrors };
export type ValidationRule = (value: any) => string | null;

export type FormSpec<T extends FormData> = {
  data: T;
  errors?: FormErrors;
};

// Context
export const FormContext = createContext<FormStore<any> | null>(null);

// Form component
type FormProps<T extends FormData> = {
  for: FormSpec<T>;
  as: string;
  change: string;
  submit: string;
  debounce?: number;
  autoRecover?: string;
  children: (form: FormStore<T>) => ReactNode;
};

export function Form<T extends FormData>({
  for: form,
  as,
  change,
  submit,
  debounce = 300,
  autoRecover,
  children,
}: FormProps<T>) {
  const vm = useLiveView();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const subject = useMemo(() => new BehaviorSubject<T>(form.data), []);
  const [recoveryState, setRecoveryState] = useState<T | null>(null);

  const onChange = useMemo(() => {
    return (data: T) => {
      subject.next(data);
    };
  }, [subject]);

  const formKey = useMemo(() => {
    for (const key of Object.keys(vm)) {
      if ((vm as any)[key] === form) {
        return key;
      }
    }
    throw new Error('Form not found in view model');
  }, [vm, form]);

  const formStore = useMemo(
    () => new FormStore(form, vm, formKey, as, onChange, change, submit),
    [form, vm, formKey, as, onChange, change, submit]
  );

  useEffect(() => {
    const subscription = subject
      .pipe(debounceTime(debounce))
      .subscribe((data) => {
        vm.pushEvent(change, { [as]: data });
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [subject, debounce, vm, as, change]);

  useEffect(() => {
    const subscription = vm
      .events$('connect')
      .pipe(map((event) => event as LiveChannelConnectEvent))
      .subscribe((event) => {
        if (event.status === LiveChannelStatus.disconnected) {
          setRecoveryState(formStore.data);
        } else if (event.status === LiveChannelStatus.connected) {
          if (
            recoveryState &&
            autoRecover !== null &&
            autoRecover !== 'ignore'
          ) {
            const recoverEvent = autoRecover || change;
            vm.pushEvent(recoverEvent, { [as]: recoveryState });
            setRecoveryState(null);
          }
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [vm, as, change, autoRecover, formStore, recoveryState, setRecoveryState]);

  return (
    <FormContext.Provider value={formStore}>
      <View>{children(formStore)}</View>
    </FormContext.Provider>
  );
}
