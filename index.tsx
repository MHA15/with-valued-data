import React, { ComponentType, forwardRef } from 'react';

export default function withResolvedData<Props, Provider extends ProviderFor<Props>>(provider: Provider, Comp: ComponentType<Props>) {
    type InjectingProps = InjectingPropsOf<Props, Provider>;
    type ParentProps = Omit<Props, keyof InjectingProps>;

    function isFunctionProvider(provider: any): provider is ProviderFor1<ParentProps> {
        return (typeof provider === 'function');
    }

    function isDictProvider(provider: any): provider is ProviderFor2<ParentProps> {
        return (typeof provider === 'object');
    }

    const AsyncResolvedComponent: ComponentType<ParentProps> = (props: ParentProps, ref: any) => {
        function calculateData() {
            if (typeof provider === 'function')
                // @ts-ignore
                return provider(props);
            else if(typeof provider === 'object')
                return Object.fromEntries(Object.entries(provider).map(([k, v]) => [k, v(props)]));
        }

        const data = calculateData();
        if (Object.values(data).some(data => data === undefined))
            return null;

        return <Comp {...props} {...data}/>;
    };
    AsyncResolvedComponent.displayName = `withAsyncResolved(${Comp.displayName || Comp.name})`;
    return forwardRef(AsyncResolvedComponent);
}

type InjectingPropsOf<Props, Provider extends ProviderFor<Props>> =
    Provider extends (p: Props) => infer R ? {[k in keyof R]: NonNullable<R[k]>} :
    Provider extends {[k in keyof (infer InjectingProps)]: (p: Props) => (infer InjectingProps)[k]} ? InjectingProps :
        never;

type ProviderFor<Props> = ProviderFor1<Props> | ProviderFor2<Props>;
type ProviderFor1<Props> = (p: Props) => { [k in keyof Props]?: Props[k] | undefined };
type ProviderFor2<Props> = { [k in keyof Props]?: (p: Props) => Props[k] | undefined };
