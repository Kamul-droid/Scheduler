import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { SchedulesService } from './schedules.service';
// import { Schedule } from './entities/schedule.entity';
// import { CreateScheduleInput } from './dto/create-schedule.input';
// import { UpdateScheduleInput } from './dto/update-schedule.input';

@Resolver(() => Object) // TODO: Replace with Schedule entity
export class ScheduleResolver {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Query(() => [Object], { name: 'schedules' })
  findAll() {
    return this.schedulesService.findAll();
  }

  @Query(() => Object, { name: 'schedule' })
  findOne(@Args('id') id: string) {
    return this.schedulesService.findOne(id);
  }

  @Mutation(() => Object)
  createSchedule(@Args('createScheduleInput') createScheduleInput: any) {
    return this.schedulesService.create(createScheduleInput);
  }

  @Mutation(() => Object)
  updateSchedule(@Args('updateScheduleInput') updateScheduleInput: any) {
    return this.schedulesService.update(
      updateScheduleInput.id,
      updateScheduleInput,
    );
  }

  @Mutation(() => Object)
  removeSchedule(@Args('id') id: string) {
    return this.schedulesService.remove(id);
  }
}

