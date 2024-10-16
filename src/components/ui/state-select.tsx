/**
 * v0 by Vercel.
 * @see https://v0.dev/t/6mCIRLk8eUy
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import {
  SelectValue,
  SelectTrigger,
  SelectLabel,
  SelectItem,
  SelectGroup,
  SelectContent,
  Select,
} from "@/components/ui/select";

interface StateSelectProps {
  id: string;
  value: string;
  setState: React.Dispatch<React.SetStateAction<string>>;
  invalidFields: { [key: string]: boolean };
}

export default function StateSelect({
  id,
  value,
  setState,
  invalidFields,
}: StateSelectProps) {
  return (
    <Select value={value} onValueChange={(value) => setState(value)}>
      <SelectTrigger
        className={`w-[240px] ${invalidFields.state ? "border-2 border-red-500" : ""}`}
      >
        <SelectValue placeholder="Select a state" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>States</SelectLabel>
          <SelectItem value="alabama">Alabama</SelectItem>
          <SelectItem value="alaska">Alaska</SelectItem>
          <SelectItem value="arizona">Arizona</SelectItem>
          <SelectItem value="arkansas">Arkansas</SelectItem>
          <SelectItem value="california">California</SelectItem>
          <SelectItem value="colorado">Colorado</SelectItem>
          <SelectItem value="connecticut">Connecticut</SelectItem>
          <SelectItem value="delaware">Delaware</SelectItem>
          <SelectItem value="florida">Florida</SelectItem>
          <SelectItem value="georgia">Georgia</SelectItem>
          <SelectItem value="hawaii">Hawaii</SelectItem>
          <SelectItem value="idaho">Idaho</SelectItem>
          <SelectItem value="illinois">Illinois</SelectItem>
          <SelectItem value="indiana">Indiana</SelectItem>
          <SelectItem value="iowa">Iowa</SelectItem>
          <SelectItem value="kansas">Kansas</SelectItem>
          <SelectItem value="kentucky">Kentucky</SelectItem>
          <SelectItem value="louisiana">Louisiana</SelectItem>
          <SelectItem value="maine">Maine</SelectItem>
          <SelectItem value="maryland">Maryland</SelectItem>
          <SelectItem value="massachusetts">Massachusetts</SelectItem>
          <SelectItem value="michigan">Michigan</SelectItem>
          <SelectItem value="minnesota">Minnesota</SelectItem>
          <SelectItem value="mississippi">Mississippi</SelectItem>
          <SelectItem value="missouri">Missouri</SelectItem>
          <SelectItem value="montana">Montana</SelectItem>
          <SelectItem value="nebraska">Nebraska</SelectItem>
          <SelectItem value="nevada">Nevada</SelectItem>
          <SelectItem value="new hampshire">New Hampshire</SelectItem>
          <SelectItem value="new jersey">New Jersey</SelectItem>
          <SelectItem value="new mexico">New Mexico</SelectItem>
          <SelectItem value="new york">New York</SelectItem>
          <SelectItem value="north carolina">North Carolina</SelectItem>
          <SelectItem value="north dakota">North Dakota</SelectItem>
          <SelectItem value="ohio">Ohio</SelectItem>
          <SelectItem value="oklahoma">Oklahoma</SelectItem>
          <SelectItem value="oregon">Oregon</SelectItem>
          <SelectItem value="pennsylvania">Pennsylvania</SelectItem>
          <SelectItem value="rhode island">Rhode Island</SelectItem>
          <SelectItem value="south carolina">South Carolina</SelectItem>
          <SelectItem value="south dakota">South Dakota</SelectItem>
          <SelectItem value="tennessee">Tennessee</SelectItem>
          <SelectItem value="texas">Texas</SelectItem>
          <SelectItem value="utah">Utah</SelectItem>
          <SelectItem value="vermont">Vermont</SelectItem>
          <SelectItem value="virginia">Virginia</SelectItem>
          <SelectItem value="washington">Washington</SelectItem>
          <SelectItem value="west virginia">West Virginia</SelectItem>
          <SelectItem value="wisconsin">Wisconsin</SelectItem>
          <SelectItem value="wyoming">Wyoming</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
