import logged from '@mfelements/logger'

export default function withLog(declaration){
    const { kind, elements, descriptor } = declaration;
    switch(kind){
        case 'class':
            elements.forEach(withLog);
            break;
        case 'method':
            const targetF = descriptor.value;
            descriptor.value = logged(() => targetF);
            break;
    }
}
