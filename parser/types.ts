type ClassDependencyMethodMap = {
  timesCalled: number;
};

type DependencyMap = {
  type: string;
  methods: {
    [key: string]: ClassDependencyMethodMap;
  };
};

export type ClassMap = {
  dependencies: {
    [key: string]: DependencyMap;
  };
  dependents: {
    [key: string]: string;
  };
};

export type Program = {
  [key: string]: ClassMap;
};
