import { useField } from 'formik';
import React from 'react';
import { Form, Label, Select } from 'semantic-ui-react';



interface Props{
    placeholder: string;
    name: string;
    label?: string;
    option: {text: string, value:string}[];
}


export default function MySelectInput(props: Props){
const [field, meta, helpers]=useField(props.name);
return (
    <Form.Field>
        <label>{props.name}</label>
        <Select 
            clearable 
            options={props.option} 
            value={field.value || null}     
            onChange={(_, d)=>helpers.setValue(d.value)}  
            onBlur={()=>{helpers.setTouched(true)}}
            placeholder={props.placeholder}
        />
        {meta.touched && meta.error ? (
            <Label basic color='red'>{meta.error}</Label>
        ):null}
    </Form.Field>
)
}
