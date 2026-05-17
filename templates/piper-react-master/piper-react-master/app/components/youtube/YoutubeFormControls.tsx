export function TextInput(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  const id = props.label.replace(/\s+/g, "-").toLowerCase();

  return (
    <div className="field">
      <label htmlFor={id}>{props.label}</label>
      <input
        id={id}
        className="textInput"
        type={props.type || "text"}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(event) => props.onChange(event.target.value)}
        disabled={props.disabled}
      />
    </div>
  );
}

export function TextArea(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const id = props.label.replace(/\s+/g, "-").toLowerCase();

  return (
    <div className="field">
      <label htmlFor={id}>{props.label}</label>
      <textarea
        id={id}
        className="compactTextarea"
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        disabled={props.disabled}
      />
    </div>
  );
}

export function SelectInput(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<string | { label: string; value: string }>;
  disabled?: boolean;
}) {
  const id = props.label.replace(/\s+/g, "-").toLowerCase();

  return (
    <div className="field">
      <label htmlFor={id}>{props.label}</label>
      <select id={id} value={props.value} onChange={(event) => props.onChange(event.target.value)} disabled={props.disabled}>
        {props.options.map((option) => {
          const optionValue = typeof option === "string" ? option : option.value;
          const optionLabel = typeof option === "string" ? option : option.label;

          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export function Checkbox(props: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="checkboxLabel">
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(event) => props.onChange(event.target.checked)}
        disabled={props.disabled}
      />
      {props.label}
    </label>
  );
}
