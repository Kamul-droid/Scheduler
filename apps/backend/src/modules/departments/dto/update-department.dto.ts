import { InputType, PartialType } from '@nestjs/graphql';
import { CreateDepartmentDto } from './create-department.dto';

@InputType()
export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}

