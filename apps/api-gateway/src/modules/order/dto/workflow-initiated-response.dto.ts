import { IWorkflowInitiatedResponseDto } from '@libs/contract/base';
import { ApiProperty } from '@nestjs/swagger';

export class WorkflowInitiatedResponseDto implements IWorkflowInitiatedResponseDto {
  @ApiProperty({
    example: 'place-order:fa3d84fc-e141-4325-af15-7c6b71caa106',
    description: 'Unique Temporal Workflow execution ID',
  })
  workflowId: string;

  @ApiProperty({
    example: 'Order placement initiated',
    description: 'Status message indicating workflow trigger',
  })
  message: string;
}
