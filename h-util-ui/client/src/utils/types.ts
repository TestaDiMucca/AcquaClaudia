export type {
    ProcessingModule,
    ActionModule,
    BranchingModule,
    Pipeline,
    TaskQueue,
    SpawnedTask,
} from '../../../common/common.types';

export { ProcessingModuleType } from '../../../common/common.types';
export { isBranchingModule } from '../../../common/common.utils';

export enum PageViews {
    Home = '/',
    // TODO: Migrate to sub-views paradigm
    Edit = '/new',
    Directories = '/directories',
    Internals = '/internals',
}

export enum SubViews {
    view = 'view',
    edit = 'edit',
}
