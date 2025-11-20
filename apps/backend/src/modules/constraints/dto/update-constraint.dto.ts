import { InputType, PartialType } from '@nestjs/graphql';
import { CreateConstraintDto } from './create-constraint.dto';

@InputType()
export class UpdateConstraintDto extends PartialType(CreateConstraintDto) {}

